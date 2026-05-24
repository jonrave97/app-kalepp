import api from './api';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ─── Tipos internos ───────────────────────────────────────────────────────────
export interface ReportUser {
    _id: string;
    name: string;
    email: string;
    rol?: string;
    company?: string;
    area?: string;
    costCenter?: string;
    position?: { _id: string; name: string } | string | null;
    disabled?: boolean;
    confirmed?: boolean;
    rut?: string;
    createdAt?: string;
}

export interface ReportRequest {
    _id: string;
    code: number;
    employee?: { _id: string; name: string; email: string } | string;
    position?: string;
    warehouse?: { _id: string; code: string; name: string } | string;
    reason: string;
    status: string;
    stock?: string;
    special?: boolean;
    date: string;
    approveDate?: string;
    deliveryDate?: string;
    epps: Array<{
        epp?: { _id: string; name: string; code: string; price: number } | string;
        quantity: number;
    }>;
}

export interface RequestReportFilters {
    from?: string;
    to?: string;
    status?: string;
    warehouse?: string;
}

export interface ReportMeta {
    total: number;
    truncated: boolean;
    limit: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const HEADER_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDD6B20' }, // naranja (primary de la app)
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
    bold: true,
    color: { argb: 'FFFFFFFF' },
    name: 'Calibri',
    size: 11,
};

const BODY_FONT: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 10,
};

const BORDER: Partial<ExcelJS.Borders> = {
    top:    { style: 'thin', color: { argb: 'FFE5E7EB' } },
    left:   { style: 'thin', color: { argb: 'FFE5E7EB' } },
    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    right:  { style: 'thin', color: { argb: 'FFE5E7EB' } },
};

const ALT_ROW_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFF7ED' }, // naranja muy suave
};

function addHeaderRow(ws: ExcelJS.Worksheet, headers: string[]) {
    const row = ws.addRow(headers);
    row.eachCell(cell => {
        cell.fill = HEADER_FILL;
        cell.font = HEADER_FONT;
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = BORDER;
    });
    row.height = 22;
}

function styleBodyRow(row: ExcelJS.Row, rowIndex: number) {
    row.height = 18;
    row.eachCell({ includeEmpty: true }, cell => {
        cell.font = BODY_FONT;
        cell.alignment = { vertical: 'middle', wrapText: false };
        cell.border = BORDER;
        if (rowIndex % 2 === 0) cell.fill = ALT_ROW_FILL;
    });
}

function triggerDownload(buffer: ArrayBuffer, filename: string) {
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, filename);
}

function formatDate(val?: string | null): string {
    if (!val) return '';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-CL');
}

/**
 * Extrae la fecha de creación desde el ObjectId de MongoDB.
 * Los primeros 4 bytes del _id codifican un timestamp Unix.
 * Funciona para TODOS los documentos existentes, incluso sin `timestamps: true`.
 */
function dateFromObjectId(id?: string | null): string {
    if (!id || id.length < 8) return '';
    try {
        const timestamp = parseInt(id.substring(0, 8), 16);
        return new Date(timestamp * 1000).toLocaleDateString('es-CL');
    } catch {
        return '';
    }
}

// ─── Reporte de Usuarios ─────────────────────────────────────────────────────
export async function downloadUsersReport(): Promise<ReportMeta> {
    const { data, headers } = await api.get<ReportUser[]>('/reports/users');

    const wb = new ExcelJS.Workbook();
    wb.creator = 'KalApp';
    wb.created = new Date();

    const ws = wb.addWorksheet('Usuarios', {
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
        views: [{ state: 'frozen', ySplit: 1 }],
    });

    const headers = [
        'N°', 'Nombre', 'Correo', 'RUT', 'Rol',
        'Empresa', 'Área', 'Centro de Costo', 'Cargo', 'Estado', 'Fecha Creación',
    ];
    const colWidths = [6, 28, 30, 14, 22, 20, 18, 16, 22, 14, 16];
    colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

    addHeaderRow(ws, headers);

    data.forEach((u, idx) => {
        const positionName =
            u.position && typeof u.position === 'object' ? u.position.name : (u.position ?? '');
        const row = ws.addRow([
            idx + 1,
            u.name,
            u.email,
            u.rut ?? '',
            u.rol  ?? '',
            u.company    ?? '',
            u.area       ?? '',
            u.costCenter ?? '',
            positionName,
            u.disabled ? 'Deshabilitado' : 'Activo',
            dateFromObjectId(u._id),
        ]);
        styleBodyRow(row, idx + 1);
    });

    const buffer = await wb.xlsx.writeBuffer();
    const today  = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
    triggerDownload(buffer as ArrayBuffer, `Reporte_Usuarios_${today}.xlsx`);

    return {
        total:     parseInt(headers['x-report-total']     ?? '0'),
        truncated: headers['x-report-truncated'] === 'true',
        limit:     parseInt(headers['x-report-limit']     ?? '5000'),
    };
}

// ─── Reporte de Solicitudes ───────────────────────────────────────────────────
export async function downloadRequestsReport(filters: RequestReportFilters = {}): Promise<ReportMeta> {
    const params: Record<string, string> = {};
    if (filters.from)      params.from      = filters.from;
    if (filters.to)        params.to        = filters.to;
    if (filters.status)    params.status    = filters.status;
    if (filters.warehouse) params.warehouse = filters.warehouse;

    const { data, headers } = await api.get<ReportRequest[]>('/reports/requests', { params });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'KalApp';
    wb.created = new Date();

    const ws = wb.addWorksheet('Solicitudes', {
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
        views: [{ state: 'frozen', ySplit: 1 }],
    });

    const headers = [
        'N° Sol.', 'Empleado', 'Correo', 'Cargo', 'Bodega',
        'Motivo', 'EPPs (cant.)', 'Costo Total ($)', 'Estado', 'Especial',
        'Fecha', 'Fecha Aprobación', 'Fecha Entrega',
    ];
    const colWidths = [9, 28, 30, 20, 18, 22, 40, 16, 20, 10, 14, 16, 14];
    colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

    addHeaderRow(ws, headers);

    let rowIdx = 0;
    for (const req of data) {
        const employeeName  = req.employee && typeof req.employee === 'object' ? req.employee.name  : (req.employee  ?? '');
        const employeeEmail = req.employee && typeof req.employee === 'object' ? req.employee.email : '';
        const warehouseName = req.warehouse && typeof req.warehouse === 'object'
            ? `${req.warehouse.code} — ${req.warehouse.name}`
            : (req.warehouse ?? '');

        const eppsDesc = req.epps
            .map(item => {
                const eppName = item.epp && typeof item.epp === 'object' ? item.epp.name : (item.epp ?? '');
                return `${eppName} (x${item.quantity})`;
            })
            .join(' | ');

        const totalCost = req.epps.reduce((acc, item) => {
            const price = item.epp && typeof item.epp === 'object' ? (item.epp.price ?? 0) : 0;
            return acc + price * item.quantity;
        }, 0);

        const row = ws.addRow([
            req.code,
            employeeName,
            employeeEmail,
            req.position ?? '',
            warehouseName,
            req.reason,
            eppsDesc,
            totalCost,
            req.status,
            req.special ? 'Sí' : 'No',
            formatDate(req.date),
            formatDate(req.approveDate),
            formatDate(req.deliveryDate),
        ]);

        // Columna Costo Total: formato moneda
        row.getCell(8).numFmt = '#,##0';

        styleBodyRow(row, rowIdx + 1);
        rowIdx++;
    }

    const buffer = await wb.xlsx.writeBuffer();
    const today  = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
    triggerDownload(buffer as ArrayBuffer, `Reporte_Solicitudes_${today}.xlsx`);

    return {
        total:     parseInt(headers['x-report-total']     ?? '0'),
        truncated: headers['x-report-truncated'] === 'true',
        limit:     parseInt(headers['x-report-limit']     ?? '5000'),
    };
}

