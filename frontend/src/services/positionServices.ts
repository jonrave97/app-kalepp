import API from './api';
import { invalidate } from './cache';
import type { PositionsResponse, Position } from '@/types/position';

export const getPositions = async (page = 1, search = ''): Promise<PositionsResponse> => {
    const response = await API.get('/positions', { params: { page, search } });
    return response.data;
};

export const createPosition = async (name: string): Promise<Position> => {
    const response = await API.post('/positions', { name });
    invalidate('dashboard:stats');
    return response.data;
};

export const updatePosition = async (id: string, name: string): Promise<Position> => {
    const response = await API.put(`/positions/${id}`, { name });
    invalidate('dashboard:stats');
    return response.data;
};

export const deletePosition = async (id: string): Promise<void> => {
    await API.delete(`/positions/${id}`);
    invalidate('dashboard:stats');
};

export const togglePosition = async (id: string): Promise<Position> => {
    const response = await API.patch(`/positions/${id}/toggle`);
    invalidate('dashboard:stats');
    return response.data;
};

export const getAllPositions = async (): Promise<Pick<Position, '_id' | 'name'>[]> => {
    const response = await API.get('/positions/all');
    return response.data;
};
