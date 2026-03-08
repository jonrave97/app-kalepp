import API from './api';
import type { Category, CategoriesResponse } from '@/types/category';

export const getCategories = async (page = 1, search = ''): Promise<CategoriesResponse> => {
    const response = await API.get('/categories', { params: { page, search } });
    return response.data;
};

export const getAllCategories = async (): Promise<Pick<Category, '_id' | 'name'>[]> => {
    const response = await API.get('/categories/all');
    return response.data;
};

export const createCategory = async (name: string): Promise<Category> => {
    const response = await API.post('/categories', { name });
    return response.data;
};

export const updateCategory = async (id: string, name: string): Promise<Category> => {
    const response = await API.put(`/categories/${id}`, { name });
    return response.data;
};

export const toggleCategory = async (id: string): Promise<Category> => {
    const response = await API.patch(`/categories/${id}/toggle`);
    return response.data;
};
