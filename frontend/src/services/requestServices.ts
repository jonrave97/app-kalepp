import API from './api';
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
    employee: { _id: string; name: string } | string;
    epps: { eppId: string; quantity: number }[];
    deliveryDate?: string;
    createdAt: string;
    updatedAt: string;
}

export const getAdminRequests = async (
    warehouseId: string,
    page = 1,
    search = '',
    limit = 10,
): Promise<AdminRequestsResponse> => {
    const response = await API.get('/requests', {
        params: { warehouse: warehouseId, page, search, limit },
    });
    return response.data;
};

export const deleteRequest = async (id: string): Promise<void> => {
    await API.delete(`/requests/${id}`);
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
    images.forEach((img, i) => form.append('images', img, `photo${i + 1}.jpg`));

    // Pass Content-Type: undefined so the browser sets the multipart boundary automatically
    const response = await API.post('/requests', form, {
        headers: { 'Content-Type': undefined },
    });
    return response.data;
};
