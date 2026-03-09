export interface RequestEppItem {
    eppId: string;
    quantity: number;
}

export interface Request {
    _id: string;
    code: number;
    employee: string;
    position: string;
    warehouse: string;
    reason: string;
    epps: RequestEppItem[];
    status: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Entregada';
    date: string;
    createdAt: string;
    updatedAt: string;
}

export const REQUEST_REASONS = [
    'Nuevo Requerimiento',
    'Reposición',
    'Deterioro',
    'Pérdida',
] as const;

export type RequestReason = typeof REQUEST_REASONS[number];

export interface CreateRequestPayload {
    warehouse: string;
    reason: string;
    epps: RequestEppItem[];
}
