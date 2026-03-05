import API from './api';
import type { PositionsResponse, Position } from '@/types/position';

export const getPositions = async (page = 1, search = ''): Promise<PositionsResponse> => {
    const response = await API.get('/positions', { params: { page, search } });
    return response.data;
};

export const createPosition = async (name: string): Promise<Position> => {
    const response = await API.post('/positions', { name });
    return response.data;
};

export const updatePosition = async (id: string, name: string): Promise<Position> => {
    const response = await API.put(`/positions/${id}`, { name });
    return response.data;
};

export const deletePosition = async (id: string): Promise<void> => {
    await API.delete(`/positions/${id}`);
};

export const togglePosition = async (id: string): Promise<Position> => {
    const response = await API.patch(`/positions/${id}/toggle`);
    return response.data;
};
