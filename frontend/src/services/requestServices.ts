import API from './api';
import { cached, invalidateByPrefix } from './cache';
import type { Request, CreateRequestPayload } from '@/types/request';
import type { Epp } from '@/types/epp';

export interface AdminRequestsResponse {
    requests: AdminRequest[];
    total: number;
    page: number;
    pages: number;
}

export interface AdminRequest {
    _id: string;
    code: number;
    date: string;
    status: string;
    stock?: string;
    position: string;
    reason: string;
    observation?: string;
    employee: {
        _id: string;
        name: string;
        sizes?: {
            footwear?: string;
            gloves?: string;
            pants?: { letter?: string; number?: string };
            shirtJacket?: string;
        };
    } | string;
    approver?: { _id: string; name: string } | string;
    approveDate?: string;
    epps: { epp: { _id: string; name: string; code?: string } | string; quantity: number }[];
    deliveryDate?: string;
    expectedStockDate?: string;
    annulReason?: string;
    createdAt: string;
    updatedAt: string;
}

export const getAdminRequests = async (
    warehouseId: string,
    page = 1,
    search = '',
    limit = 10,
    status = '',
): Promise<AdminRequestsResponse> => {
    const response = await API.get('/requests', {
        params: { warehouse: warehouseId, page, search, limit, ...(status ? { status } : {}) },
    });
    return response.data;
};

// Historial de solicitudes de un miembro del equipo (Jefatura)
export const getTeamMemberRequests = async (
    employeeId: string,
    page = 1,
    search = '',
    limit = 10,
    status = '',
): Promise<AdminRequestsResponse> => {
    const response = await API.get('/requests', {
        params: { employee: employeeId, page, search, limit, ...(status ? { status } : {}) },
    });
    return response.data;
};

export const getMyRequests = (
    employeeId: string,
    page = 1,
    search = '',
    limit = 10,
    reason?: string,
): Promise<AdminRequestsResponse> => {
    const key = `requests:employee:${employeeId}:p${page}:s${search}:l${limit}:r${reason ?? ''}`;
    return cached(key, () =>
        API.get('/requests', {
            params: { employee: employeeId, page, search, limit, ...(reason ? { reason } : {}) },
        }).then(r => r.data),
    );
};

export const deleteRequest = async (id: string, employeeId?: string): Promise<void> => {
    await API.delete(`/requests/${id}`);
    if (employeeId) invalidateByPrefix(`requests:employee:${employeeId}:`);
};

export const getMyEpps = async (): Promise<Pick<Epp, '_id' | 'code' | 'name'>[]> => {
    const response = await API.get('/requests/my-epps');
    return response.data;
};

export const createRequest = async (
    payload: CreateRequestPayload,
    images: File[],
): Promise<Request> => {
    const form = new FormData();
    form.append('warehouse', payload.warehouse);
    form.append('reason',    payload.reason);
    form.append('epps',      JSON.stringify(payload.epps));
    if (payload.employee) form.append('employee', payload.employee);
    images.forEach((img, i) => form.append('images', img, `photo${i + 1}.jpg`));

    // Pass Content-Type: undefined so the browser sets the multipart boundary automatically
    const response = await API.post('/requests', form, {
        headers: { 'Content-Type': undefined },
    });
    if (payload.employee) invalidateByPrefix(`requests:employee:${payload.employee}:`);
    return response.data;
};

export const deliverRequest = async (id: string): Promise<AdminRequest> => {
    const response = await API.patch(`/requests/${id}/deliver`);
    return response.data;
};

export const reportNoStock = async (id: string, expectedDate: string): Promise<AdminRequest> => {
    const response = await API.patch(`/requests/${id}/no-stock`, { expectedDate });
    return response.data;
};

export const annulRequest = async (id: string, reason: string): Promise<AdminRequest> => {
    const response = await API.patch(`/requests/${id}/annul`, { reason });
    return response.data;
};

export const downloadRequestPdf = async (id: string, code: number, employeeName: string): Promise<void> => {
    const response = await API.get(`/requests/${id}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Documento de Entrega N° ${code} de ${employeeName}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};
