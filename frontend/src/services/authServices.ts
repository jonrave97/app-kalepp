import API from './api';
import type { UserSizes } from '@/types/userSizes';

// Función para iniciar sesión de usuario
// Recibe email y password como parámetros
// Realiza una petición POST al endpoint /users/login
export const loginUser = async (email: string, password: string) => {
  try {
    const response = await API.post('/users/login', { email, password });
    if(response.data)
    {
      return response.data;
    }
    else{
      throw new Error('No se recibió respuesta del servidor');
    }
    // console.log('Respuesta del servidor:', response.data);
  } catch (error) {
    // console.error('Error al login:', error);
    throw error;
  }
};

export const forgotPassword = async (email: string) => {
  const response = await API.post('/users/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token: string, password: string) => {
  const response = await API.post(`/users/reset-password/${token}`, { password });
  return response.data;
};
export const updateUserSizes = async (sizes: UserSizes) => {
  try {
    const response = await API.patch('/users/profile/sizes', { sizes });
    return response.data;
  } catch (error) {
    throw error;
  }
};