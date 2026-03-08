import type {UserSizes } from './userSizes'; // Importar UserSizes

// Definición de la interfaz User
export interface User {
	_id: string; // Identificador único del usuario
	name: string; // Nombre del usuario
	password?: string; // Contraseña del usuario (opcional)
	email: string; // Correo electrónico del usuario
	rol?: string; // Rol del usuario
	role?: string; // backward compat
	confirmed?: boolean; // Indica si el usuario está confirmado (opcional)
	disabled?: boolean;
	company?: string;
	area?: string;
	costCenter?: string;
	warehouses?: string;
	position?: string | { _id: string; name: string } | null;
	bosses?: Array<{
		_id: string | { _id: string; name: string; email: string };
	}>;
	token?: string;
	rut?: string;
	sizes?: UserSizes;
}

export interface UsersResponse {
	users: User[];
	total: number;
	page: number;
	totalPages: number;
}