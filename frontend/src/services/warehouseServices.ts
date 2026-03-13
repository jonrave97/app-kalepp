import API from './api';
import type { Warehouse, WarehousesResponse } from '@/types/warehouse';

export const getWarehouses = async (page = 1, search = ''): Promise<WarehousesResponse> => {
    const response = await API.get('/warehouses', { params: { page, search } });
    return response.data;
};

export const getWarehouseById = async (id: string): Promise<Warehouse> => {
    const response = await API.get(`/warehouses/${id}`);
    return response.data;
};

export const getAllWarehouses = async (): Promise<Pick<Warehouse, '_id' | 'code' | 'name'>[]> => {
    const response = await API.get('/warehouses/all');
    return response.data;
};

export const createWarehouse = async (data: {
    code: string;
    name: string;
}): Promise<Warehouse> => {
    const response = await API.post('/warehouses', data);
    return response.data;
};

export const updateWarehouse = async (id: string, data: {
    code: string;
    name: string;
}): Promise<Warehouse> => {
    const response = await API.put(`/warehouses/${id}`, data);
    return response.data;
};

export const toggleWarehouse = async (id: string): Promise<Warehouse> => {
    const response = await API.patch(`/warehouses/${id}/toggle`);
    return response.data;
};
