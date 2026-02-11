import { useState } from 'react';
import { useNavigate} from 'react-router-dom';
import type { User } from '@/types/user';
import { useAuth } from '@context/Authcontext'
import { useLoginForm , useAuthenticate  } from './useLoginForm';
import API from '@/services/api';
import Swal from 'sweetalert2';

// Tipo de respuesta del backend en login
type LoginResponse = {
  message: string;
  user: User;
}

export const useLogin = () =>
{
	const navigate = useNavigate();
	const {setAuth} = useAuth();

	const form = useLoginForm();
	const auth = useAuthenticate();

	// Estado local para errores de validación
	const [validationError, setValidationError] = useState<string | null>(null);

	const handleLogin = async (e: React.FormEvent) =>
	{
		e.preventDefault();

		// Limpiar errores previos
		setValidationError(null);

		// Validar solo al hacer submit
		const validation = form.validate();

		if (!validation.isValid) 
		{
			// setValidationError(validation.error || 'Error de validación');

			// Mostrar alerta de error
			Swal.fire({
				icon: 'error',
				title: 'Error de Autenticación',
				text: validation.error || 'Por favor, completa todos los campos obligatorios.',
				confirmButtonText: 'Ok',
				confirmButtonColor: '#FF6900'
			});
	    	return;
	    }

	    try 
	    {
	      // Llamar API de autenticación
	      await auth.authenticate(
	        form.email,
	        form.password,
	        async (response: LoginResponse) => {
	          // La cookie ya está establecida por el backend automáticamente
	          
	          // Establecer flag de sesión para futuras verificaciones
	          sessionStorage.setItem('hasSession', 'true');
	          
	          // Obtener datos completos del perfil en lugar de usar los datos mínimos del login
	          try {
	            const profileResponse = await API.get('/users/profile');
	            setAuth(profileResponse.data);
	          } catch (error) {
	            console.error('Error al obtener perfil completo:', error);
	            // Fallback: usar datos del login
	            setAuth({
	              _id: response.user._id,
	              email: response.user.email,
	              name: response.user.name || response.user.email,
	              role: response.user.role,
	            });
	          }

	          form.resetForm();

	          // Navegar al dashboard
	          navigate('/dashboard', { replace: true });
	        }
	      );
	    } 
	    catch (err) 
	    {
	      // Los errores de autenticación ya están en auth.error
			Swal.fire({
				icon: 'error',
				title: 'Error de Autenticación',
				text: auth.error || 'Credenciales Incorrectas.',
				confirmButtonText: 'Ok',
				confirmButtonColor: '#FF6900'
			})

	    //   if (import.meta.env.DEV) {
	    //     console.error('❌ Error de login:', err);
	    //   }
	    }
	};

	return {
		email: form.email,
		setEmail: form.setEmail,
		password: form.password,
		setPassword: form.setPassword,

		loading: auth.loading,
		// Combinar errores: validación O autenticación
		error: validationError || auth.error,
		handleLogin

	}

}

