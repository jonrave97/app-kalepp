import API from './api';
import type { Kit, KitsResponse } from '@/types/kit';

export const getKits = async (page = 1, search = ''): Promise<KitsResponse> => {
    const response = await API.get('/kits', { params: { page, search } });
    return response.data;
};

export const getAllKits = async (): Promise<Kit[]> => {
    const response = await API.get('/kits/all');
    return response.data;
};

export const createKit = async (data: {
    name: string;
    description: string;
    epps: { epp: string; quantity: number }[];
}): Promise<Kit> => {
    const response = await API.post('/kits', data);
    return response.data;
};

export const updateKit = async (
    id: string,
    data: { name: string; description: string; epps: { epp: string; quantity: number }[] },
): Promise<Kit> => {
    const response = await API.put(`/kits/${id}`, data);
    return response.data;
};

export const toggleKit = async (id: string): Promise<Kit> => {
    const response = await API.patch(`/kits/${id}/toggle`);
    return response.data;
};

export const deleteKit = async (id: string): Promise<void> => {
    await API.delete(`/kits/${id}`);
};
