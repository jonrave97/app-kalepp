import API from './api';
import type { Request, CreateRequestPayload } from '@/types/request';
import type { Epp } from '@/types/epp';

export const getMyEpps = async (): Promise<Pick<Epp, '_id' | 'code' | 'name'>[]> => {
    const response = await API.get('/requests/my-epps');
    return response.data;
};

export const createRequest = async (payload: CreateRequestPayload): Promise<Request> => {
    const response = await API.post('/requests', payload);
    return response.data;
};
