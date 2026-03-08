import API from './api';
import type { Epp, EppsResponse } from '@/types/epp';

export const getEpps = async (page = 1, search = ''): Promise<EppsResponse> => {
    const response = await API.get('/epps', { params: { page, search } });
    return response.data;
};

export const getAllEpps = async (): Promise<Pick<Epp, '_id' | 'code' | 'name'>[]> => {
    const response = await API.get('/epps/all');
    return response.data;
};

export const createEpp = async (data: {
    code: string;
    name: string;
    price: number;
    category: string;
}): Promise<Epp> => {
    const response = await API.post('/epps', data);
    return response.data;
};

export const updateEpp = async (id: string, data: {
    code: string;
    name: string;
    price: number;
    category: string;
}): Promise<Epp> => {
    const response = await API.put(`/epps/${id}`, data);
    return response.data;
};

export const toggleEpp = async (id: string): Promise<Epp> => {
    const response = await API.patch(`/epps/${id}/toggle`);
    return response.data;
};
