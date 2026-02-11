import type {UserSizes } from './userSizes'; // Importar UserSizes

// Definición de la interfaz User
export interface User {
	_id: string; // Identificador único del usuario
	name: string; // Nombre del usuario
	password?: string; // Contraseña del usuario (opcional)
	email: string; // Correo electrónico del usuario
	role?: string; // Rol del usuario (opcional)
	confirmed?: boolean; // Indica si el usuario está confirmado (opcional)
	disabled?: boolean;
	company?: string;
	area?: string;
	costCenter?: string;
	position?: string;
	bosses?: Array<{
		_id: string | { _id: string; name: string; email: string };
	}>;
	token?: string;
	rut?: string;
	sizes?: UserSizes;
}