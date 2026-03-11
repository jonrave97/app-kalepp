import API from './api';
import type { Request, CreateRequestPayload } from '@/types/request';
import type { Epp } from '@/types/epp';

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
