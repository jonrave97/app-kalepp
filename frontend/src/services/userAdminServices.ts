import API from './api';
import { invalidate } from './cache';
import type { User, UsersResponse } from '@/types/user';

export interface UserFormData {
    name: string;
    email: string;
    password?: string;
    rol: string;
    position?: string;
    company?: string;
    area?: string;
    costCenter?: string;
    warehouses?: string;  // ObjectId as string
    bosses?: string[];
}

export const getUsers = async (page = 1, search = ''): Promise<UsersResponse> => {
    const response = await API.get('/users/admin', { params: { page, search } });
    return response.data;
};

export const getAllUsersMin = async (): Promise<Pick<User, '_id' | 'name' | 'email'>[]> => {
    const response = await API.get('/users/admin/all');
    return response.data;
};

export const getAllActiveUsers = async (): Promise<Pick<User, '_id' | 'name' | 'email'>[]> => {
    const response = await API.get('/users/admin/active');
    return response.data;
};

export const createUser = async (data: UserFormData): Promise<User> => {
    const response = await API.post('/users/admin', data);
    invalidate('dashboard:stats');
    return response.data;
};

export const updateUser = async (id: string, data: UserFormData): Promise<User> => {
    const response = await API.put(`/users/admin/${id}`, data);
    invalidate('dashboard:stats');
    return response.data;
};

export const toggleUser = async (id: string): Promise<User> => {
    const response = await API.patch(`/users/admin/${id}/toggle`);
    invalidate('dashboard:stats');
    return response.data;
};

// ── Mi equipo (Jefatura) ──────────────────────────────────────────────────────
export type TeamMember = Pick<User, '_id' | 'name' | 'email' | 'rol' | 'area' | 'disabled'> & {
    position?: { _id: string; name: string } | string | null;
};

export const getMyTeam = async (): Promise<TeamMember[]> => {
    const response = await API.get('/users/my-team');
    return response.data;
};

