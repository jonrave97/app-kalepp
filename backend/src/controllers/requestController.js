import multer from 'multer';
import PDFDocument from 'pdfkit';
import Request from '../models/requestModel.js';
import User from '../models/userModel.js';
import Epp from '../models/eppModel.js';
import Warehouse from '../models/warehouseModel.js';
import { sendRequestEmail } from '../helpers/mailer.js';

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGES   = 5;

export const upload = multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
        cb(new Error('Formato no permitido. Solo JPG, PNG o WEBP'));
    },
});

// GET /api/requests/my-epps
export const getMyEpps = async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate({
            path: 'position',
            populate: {
                path: 'epps',
                model: 'Epps',
                match: { disabled: { $ne: true } },
                select: '_id code name',
            },
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(user.position?.epps ?? []);
    } catch (error) {
        console.error('Error al obtener EPPs del cargo:', error);
        res.status(500).json({ message: 'Error al obtener los EPPs' });
    }
};

// POST /api/requests
export const createRequest = async (req, res) => {
    try {
        const { warehouse, reason } = req.body;

        // epps arrives as a JSON string from multipart FormData
        let epps;
        try {
            epps = JSON.parse(req.body.epps || '[]');
        } catch {
            return res.status(400).json({ message: 'Formato inválido de EPPs' });
        }

        const files = req.files || [];

        // Validar límite de imágenes
        if (files.length > MAX_IMAGES) {
            return res.status(400).json({ message: `Máximo ${MAX_IMAGES} imágenes permitidas` });
        }

        // Validaciones básicas
        if (!warehouse) {
            return res.status(400).json({ message: 'La bodega es obligatoria' });
        }
        if (!reason) {
            return res.status(400).json({ message: 'El motivo es obligatorio' });
        }
        if (!Array.isArray(epps) || epps.length === 0) {
            return res.status(400).json({ message: 'Debe incluir al menos un EPP en la solicitud' });
        }

        // Validar imagen obligatoria para "Deterioro"
        if (reason === 'Deterioro' && files.length === 0) {
            return res.status(400).json({ message: 'El motivo "Deterioro" requiere al menos una imagen de evidencia' });
        }

        // Validar que todas las cantidades sean > 0
        const invalidQty = epps.some(e => !e.eppId || !e.quantity || Number(e.quantity) < 1);
        if (invalidQty) {
            return res.status(400).json({ message: 'Todos los EPPs deben tener una cantidad mayor a 0' });
        }

        // Obtener el cargo del empleado autenticado con sus EPPs
        const user = await User.findById(req.userId).populate({
            path: 'position',
            populate: { path: 'epps', model: 'Epps', select: '_id' },
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // HR users creating Kit Inicial Trabajador Nuevo bypass position EPP check
        const isHRKitRequest = user.area === 'HUMAN RESOURCES' && reason === 'Kit Inicial Trabajador Nuevo';

        if (!isHRKitRequest) {
            // Validar que todos los EPPs solicitados pertenezcan al cargo del trabajador
            const allowedIds = new Set((user.position?.epps ?? []).map(e => e._id.toString()));
            const unauthorized = epps.some(e => !allowedIds.has(e.eppId.toString()));
            if (unauthorized) {
                return res.status(403).json({ message: 'Uno o más EPPs no están permitidos para su cargo' });
            }
        }

        let employeeId   = req.userId;
        let positionName = user.position?.name ?? '';

        if (isHRKitRequest) {
            if (!req.body.employee) {
                return res.status(400).json({ message: 'Debe seleccionar un trabajador para Kit Inicial Trabajador Nuevo' });
            }
            const targetEmployee = await User.findById(req.body.employee).populate('position', 'name');
            if (!targetEmployee) {
                return res.status(404).json({ message: 'Trabajador seleccionado no encontrado' });
            }
            if (targetEmployee.disabled) {
                return res.status(400).json({ message: 'El trabajador seleccionado está deshabilitado' });
            }
            employeeId   = targetEmployee._id;
            positionName = targetEmployee.position?.name ?? '';
        }

        const request = await Request.create({
            employee:  employeeId,
            position:  positionName,
            warehouse,
            reason,
            epps: epps.map(e => ({
                epp:      e.eppId,
                quantity: Number(e.quantity),
            })),
        });

        // Auto-approve for HR Kit Initial requests
        if (isHRKitRequest) {
            request.status      = 'Aprobada';
            request.approver    = req.userId;
            request.approveDate = new Date();
            request.bosses      = [];
            await request.save();
        }

        res.status(201).json(request);

        // Send email only for non-auto-approved requests
        if (!isHRKitRequest) {
            _sendEmailAsync(request, user, warehouse, epps, files).catch(err =>
                console.error('[mailer] Error al enviar correo:', err)
            );
        }

    } catch (error) {
        console.error('Error al crear solicitud:', error);
        if (error.name === 'ValidationError') {
            const msg = Object.values(error.errors)[0]?.message || 'Error de validación';
            return res.status(400).json({ message: msg });
        }
        res.status(500).json({ message: 'Error al crear la solicitud' });
    }
};

// GET /api/requests?warehouse=id&employee=id&reason=text&page=1&limit=10&search=texto
export const getRequests = async (req, res) => {
    try {
        const page        = Math.max(1, parseInt(req.query.page)  || 1);
        const limit       = Math.max(1, parseInt(req.query.limit) || 10);
        const search      = (req.query.search || '').trim();
        const warehouseId = req.query.warehouse;
        const employeeId  = req.query.employee;
        const reason      = req.query.reason;

        const filter = {};
        if (warehouseId) filter.warehouse = warehouseId;
        if (reason) filter.reason = reason;
        // When filtering by employee, allow only own requests (unless warehouse admin view)
        if (employeeId) {
            if (employeeId !== req.userId.toString()) {
                return res.status(403).json({ message: 'No puedes ver solicitudes de otros usuarios' });
            }
            filter.employee = employeeId;
        }

        if (search) {
            const matchedUsers = await User.find(
                { name: { $regex: search, $options: 'i' } }
            ).select('_id');
            const userIds = matchedUsers.map(u => u._id);
            const codeNum = parseInt(search);
            const orClauses = [{ employee: { $in: userIds } }];
            if (!isNaN(codeNum)) orClauses.push({ code: codeNum });
            filter.$or = orClauses;
        }

        const total    = await Request.countDocuments(filter);
        const requests = await Request.find(filter)
            .populate('employee', 'name')
            .populate('approver', 'name')
            .populate('epps.epp', 'name code')
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            requests,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error al obtener solicitudes:', error);
        res.status(500).json({ message: 'Error al obtener las solicitudes' });
    }
};

// DELETE /api/requests/:id
export const deleteRequest = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('rol role');
        const userRole = user?.rol || user?.role;
        if (userRole !== 'Administrador') {
            return res.status(403).json({ message: 'No tienes permisos para eliminar solicitudes' });
        }

        const request = await Request.findByIdAndDelete(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }
        res.json({ message: 'Solicitud eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar solicitud:', error);
        res.status(500).json({ message: 'Error al eliminar la solicitud' });
    }
};

// GET /api/requests/:id/pdf
export const getRequestPdf = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
            .populate('employee', 'name')
            .populate('approver', 'name')
            .populate('warehouse', 'name code')
            .populate('epps.epp', 'name code');

        if (!request) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }

        // Only the owner can download
        const employeeId = request.employee?._id ?? request.employee;
        if (employeeId.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: 'No tienes permiso para descargar este documento' });
        }

        // Only delivered requests
        if (request.status !== 'Entregada' && request.status !== 'Entregado') {
            return res.status(400).json({ message: 'El documento solo está disponible para solicitudes entregadas' });
        }

        const employeeName = request.employee?.name ?? '—';
        const approverName = request.approver?.name ?? '—';
        const warehouseDoc = request.warehouse;
        const warehouseName = warehouseDoc
            ? `${warehouseDoc.code ?? ''} — ${warehouseDoc.name ?? ''}`
            : '—';
        const approveDate = request.approveDate
            ? new Date(request.approveDate).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })
            : '—';

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="solicitud-${request.code}.pdf"`);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.pipe(res);

        const pageW    = doc.page.width;   // 595.28
        const marginL  = 50;
        const marginR  = 50;
        const contentW = pageW - marginL - marginR;

        // ── Paleta del sistema ────────────────────────────────────────────────
        const CLR = {
            primary:      '#1a3a5c',
            primaryMid:   '#2563eb',
            primaryLight: '#dce8f5',
            white:        '#ffffff',
            gray900:      '#111827',
            gray600:      '#4b5563',
            gray400:      '#9ca3af',
            gray200:      '#e5e7eb',
            gray50:       '#f9fafb',
            legalAccent:  '#93c5fd',
            declBg:       '#f0f5fa',
        };

        // ── Helpers ────────────────────────────────────────────────────────────
        const drawRule = (color = CLR.gray200) => {
            doc.fontSize(10);
            doc.moveTo(marginL, doc.y)
               .lineTo(pageW - marginR, doc.y)
               .strokeColor(color).lineWidth(0.5).stroke();
            doc.moveDown(0.7);
        };

        const drawSectionTitle = (title) => {
            doc.fontSize(10);
            doc.moveDown(0.4);
            const y = doc.y;
            doc.rect(marginL, y, 3, 13).fillColor(CLR.primary).fill();
            doc.fontSize(10).fillColor(CLR.primary).font('Helvetica-Bold')
               .text(title, marginL + 12, y, { width: contentW - 12 });
            doc.moveDown(0.5);
        };

        const drawDataTable = (rows, startY, labelW) => {
            const valColX  = marginL + labelW;
            const valColW  = contentW - labelW;
            const rowH     = 22;
            for (let i = 0; i < rows.length; i++) {
                const [label, value] = rows[i];
                const rowY = startY + i * rowH;
                // row background
                doc.rect(marginL, rowY, contentW, rowH)
                   .fillColor(i % 2 === 0 ? CLR.gray50 : CLR.white).fill();
                // label cell background
                doc.rect(marginL, rowY, labelW, rowH)
                   .fillColor(CLR.primaryLight).fill();
                // internal divider between rows (skip first)
                if (i > 0) {
                    doc.moveTo(marginL, rowY).lineTo(marginL + contentW, rowY)
                       .strokeColor(CLR.gray200).lineWidth(0.3).stroke();
                }
                doc.fontSize(8.5).fillColor(CLR.primary).font('Helvetica-Bold')
                   .text(label, marginL + 8, rowY + 7, { width: labelW - 14 });
                doc.fillColor(CLR.gray900).font('Helvetica')
                   .text(value, valColX + 8, rowY + 7, { width: valColW - 12 });
            }
            const tableH = rows.length * rowH;
            doc.y = startY + tableH;
            // outer border
            doc.rect(marginL, startY, contentW, tableH)
               .strokeColor(CLR.gray200).lineWidth(0.5).stroke();
            // vertical column divider
            doc.moveTo(valColX, startY).lineTo(valColX, doc.y)
               .strokeColor(CLR.gray200).lineWidth(0.3).stroke();
        };

        // ── Encabezado (banner completo) ──────────────────────────────────────
        doc.rect(0, 0, pageW, 82).fillColor(CLR.primary).fill();
        doc.rect(0, 82, pageW, 4).fillColor(CLR.primaryMid).fill();

        doc.fontSize(8).fillColor('#7fb3d3').font('Helvetica')
           .text('DOCUMENTO DE APROBACIÓN DE SOLICITUD', marginL, 18,
                 { width: contentW, align: 'center' });

        doc.fontSize(22).fillColor(CLR.white).font('Helvetica-Bold')
           .text(`Solicitud Nº ${request.code}`, marginL, 38,
                 { width: contentW, align: 'center' });

        doc.y = 108;

        // ── Marco Legal ───────────────────────────────────────────────────────
        drawSectionTitle('Marco Legal');

        const legalStartY = doc.y;

        doc.fontSize(8.5).fillColor(CLR.gray600).font('Helvetica-Bold')
           .text('Ley 16.744 Art. 68 inciso tercero', marginL + 12, doc.y);
        doc.font('Helvetica-Oblique').fillColor(CLR.gray900)
           .text('"Las empresas deberán proporcionar a sus trabajadores los equipos e implementos de protección necesarios, no pudiendo en caso alguno cobrarles su valor."',
                marginL + 12, doc.y, { width: contentW - 24 });

        doc.moveDown(0.5);

        doc.fontSize(8.5).fillColor(CLR.gray600).font('Helvetica-Bold')
           .text('DS 594 Artículo 53', marginL + 12, doc.y);
        doc.font('Helvetica-Oblique').fillColor(CLR.gray900)
           .text('"El empleador deberá proporcionar a sus trabajadores, libres de costo, los elementos de protección personal adecuados al riesgo."',
                marginL + 12, doc.y, { width: contentW - 24 });

        // accent bar alongside legal block (drawn after text since it doesn't overlap)
        const legalBlockH = doc.y - legalStartY + 8;
        doc.rect(marginL, legalStartY - 2, 3, legalBlockH).fillColor(CLR.legalAccent).fill();

        doc.moveDown(0.8);
        drawRule();

        // ── Datos del Trabajador ──────────────────────────────────────────────
        drawSectionTitle('Datos del Trabajador');

        const workerRows = [
            ['Nombre Trabajador', employeeName],
            ['Cargo',             request.position || '—'],
            ['Motivo Solicitud',  request.reason],
            ['Bodega',            warehouseName],
        ];

        drawDataTable(workerRows, doc.y, 155);
        doc.moveDown(0.8);
        drawRule();

        // ── Elementos de Protección Personal ─────────────────────────────────
        drawSectionTitle('Elementos de Protección Personal (EPP)');

        const qtyColW    = 80;
        const eppNameW   = contentW - qtyColW;
        const qtyColX    = marginL + eppNameW;
        const eppHdrH    = 24;
        const eppRowH    = 22;
        const eppStartY  = doc.y;

        // header row
        doc.rect(marginL, eppStartY, contentW, eppHdrH).fillColor(CLR.primary).fill();
        doc.fontSize(8.5).fillColor(CLR.white).font('Helvetica-Bold')
           .text('Elemento de Protección Personal', marginL + 8, eppStartY + 8,
                 { width: eppNameW - 14 })
           .text('Cantidad', qtyColX, eppStartY + 8,
                 { width: qtyColW - 8, align: 'center' });

        let eppCurY = eppStartY + eppHdrH;
        for (let i = 0; i < request.epps.length; i++) {
            const item    = request.epps[i];
            const eppName = item.epp?.name ?? item.epp?.toString() ?? '—';
            doc.rect(marginL, eppCurY, contentW, eppRowH)
               .fillColor(i % 2 === 0 ? CLR.gray50 : CLR.white).fill();
            doc.moveTo(marginL, eppCurY).lineTo(marginL + contentW, eppCurY)
               .strokeColor(CLR.gray200).lineWidth(0.3).stroke();
            doc.fontSize(8.5).fillColor(CLR.gray900).font('Helvetica')
               .text(eppName, marginL + 8, eppCurY + 7, { width: eppNameW - 14 })
               .text(String(item.quantity), qtyColX, eppCurY + 7,
                     { width: qtyColW - 8, align: 'center' });
            eppCurY += eppRowH;
        }
        doc.y = eppCurY;
        // outer border
        doc.rect(marginL, eppStartY, contentW, eppHdrH + request.epps.length * eppRowH)
           .strokeColor(CLR.gray200).lineWidth(0.5).stroke();
        // vertical column divider
        doc.moveTo(qtyColX, eppStartY).lineTo(qtyColX, eppCurY)
           .strokeColor(CLR.gray200).lineWidth(0.3).stroke();

        doc.moveDown(0.8);
        drawRule();

        // ── Aprobación ────────────────────────────────────────────────────────
        drawSectionTitle('Aprobación');

        const approvalRows = [
            ['Aprobada Por',        approverName],
            ['Fecha de Aprobación', approveDate],
        ];

        drawDataTable(approvalRows, doc.y, 155);
        doc.moveDown(0.8);
        drawRule();

        // ── Declaración final ─────────────────────────────────────────────────
        const declText = '"El trabajador se compromete a mantener los elementos de protección personal en buen estado y declara haberlos recibido en forma gratuita."';
        doc.fontSize(8.5).font('Helvetica-Oblique');
        const declTextH = doc.heightOfString(declText, { width: contentW - 24 });
        const declBoxH  = declTextH + 24;
        const declBoxY  = doc.y;

        doc.rect(marginL, declBoxY, contentW, declBoxH).fillColor(CLR.declBg).fill();
        doc.rect(marginL, declBoxY, 4, declBoxH).fillColor(CLR.primary).fill();
        doc.fillColor(CLR.gray900)
           .text(declText, marginL + 14, declBoxY + 12,
                 { width: contentW - 22, align: 'justify' });
        doc.y = declBoxY + declBoxH;

        doc.moveDown(2.5);

        // ── Firma ─────────────────────────────────────────────────────────────
        const sigX = marginL;
        const sigW = 185;
        doc.moveTo(sigX, doc.y).lineTo(sigX + sigW, doc.y)
           .strokeColor(CLR.gray600).lineWidth(0.8).stroke();
        doc.moveDown(0.4);
        doc.fontSize(8).fillColor(CLR.gray400).font('Helvetica')
           .text('Firma del trabajador', sigX, doc.y, { width: sigW, align: 'center' });

        doc.end();
    } catch (error) {
        console.error('Error al generar PDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error al generar el documento PDF' });
        }
    }
};

// ─── Internal: email helper ──────────────────────────────────────────────────
async function _sendEmailAsync(request, user, warehouseId, eppItems, files) {
    // Get approver (boss) emails
    const bossIds = (user.bosses || []).map(b => b._id).filter(Boolean);
    const approvers = bossIds.length > 0
        ? await User.find({ _id: { $in: bossIds } }).select('name email')
        : [];

    if (approvers.length === 0) {
        console.warn('[mailer] Sin aprobadores configurados, correo omitido');
        return;
    }

    // Populate EPP names for email body
    const eppIds   = eppItems.map(e => e.eppId);
    const eppDocs  = await Epp.find({ _id: { $in: eppIds } }).select('name code');
    const eppMap   = Object.fromEntries(eppDocs.map(e => [e._id.toString(), e]));

    const enrichedEpps = eppItems.map(e => ({
        ...e,
        name: eppMap[e.eppId.toString()]?.name ?? '—',
        code: eppMap[e.eppId.toString()]?.code ?? '',
    }));

    // Get warehouse display name
    const warehouseDoc  = await Warehouse.findById(warehouseId).select('name code');
    const warehouseName = warehouseDoc
        ? `${warehouseDoc.code} — ${warehouseDoc.name}`
        : warehouseId;

    await sendRequestEmail({
        request,
        employeeName:  user.name,
        positionName:  user.position?.name ?? '',
        warehouseName,
        eppItems:      enrichedEpps,
        approvers,
        images:        files,
    });
}
