import multer from 'multer';
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

        // Validar que todos los EPPs solicitados pertenezcan al cargo del trabajador
        const allowedIds = new Set((user.position?.epps ?? []).map(e => e._id.toString()));
        const unauthorized = epps.some(e => !allowedIds.has(e.eppId.toString()));
        if (unauthorized) {
            return res.status(403).json({ message: 'Uno o más EPPs no están permitidos para su cargo' });
        }

        const positionName = user.position?.name ?? '';

        const request = await Request.create({
            employee:  req.userId,
            position:  positionName,
            warehouse,
            reason,
            epps: epps.map(e => ({
                epp:      e.eppId,
                quantity: Number(e.quantity),
            })),
        });

        res.status(201).json(request);

        // Email: send asynchronously so it never delays the response
        _sendEmailAsync(request, user, warehouse, epps, files).catch(err =>
            console.error('[mailer] Error al enviar correo:', err)
        );

    } catch (error) {
        console.error('Error al crear solicitud:', error);
        if (error.name === 'ValidationError') {
            const msg = Object.values(error.errors)[0]?.message || 'Error de validación';
            return res.status(400).json({ message: msg });
        }
        res.status(500).json({ message: 'Error al crear la solicitud' });
    }
};

// GET /api/requests?warehouse=id&employee=id&page=1&limit=10&search=texto
export const getRequests = async (req, res) => {
    try {
        const page        = Math.max(1, parseInt(req.query.page)  || 1);
        const limit       = Math.max(1, parseInt(req.query.limit) || 10);
        const search      = (req.query.search || '').trim();
        const warehouseId = req.query.warehouse;
        const employeeId  = req.query.employee;

        const filter = {};
        if (warehouseId) filter.warehouse = warehouseId;
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
