import API from './api';
import { cached, invalidate } from './cache';
import type { Epp, EppsResponse } from '@/types/epp';

export const getEpps = async (page = 1, search = ''): Promise<EppsResponse> => {
    const response = await API.get('/epps', { params: { page, search } });
    return response.data;
};

export const getAllEpps = (): Promise<Pick<Epp, '_id' | 'code' | 'name'>[]> =>
    cached('epps:all', () => API.get('/epps/all').then(r => r.data));

export const createEpp = async (data: {
    code: string;
    name: string;
    price: number;
    category: string;
}): Promise<Epp> => {
    const response = await API.post('/epps', data);
    invalidate('epps:all');
    return response.data;
};

export const updateEpp = async (id: string, data: {
    code: string;
    name: string;
    price: number;
    category: string;
}): Promise<Epp> => {
    const response = await API.put(`/epps/${id}`, data);
    invalidate('epps:all');
    return response.data;
};

export const toggleEpp = async (id: string): Promise<Epp> => {
    const response = await API.patch(`/epps/${id}/toggle`);
    invalidate('epps:all');
    return response.data;
};
