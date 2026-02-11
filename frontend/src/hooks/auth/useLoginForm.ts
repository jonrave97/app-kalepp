import { loginUser } from '@/services/authServices';
import {useState} from 'react';
// import {useNavigate} from 'react-router-dom';
// import {loginUser} from '@services/authService';

export const useLoginForm = () => 
{
	//Definimos estados de control 
	const [email, setEmail] = useState<string>('');
	const [password, setPassword] =useState<string>('');
	// const [loading , setLoading] = useState<boolean>(false);
	// const [error, setError] = useState<string | null>(null);

	const resetForm = () => 
	{
		setEmail('');
		setPassword('');
	};

	const validate = () => 
	{
		if (!email || !password)
		{
			return{
				isValid: false,
				error: 'Por favor completa todos los campos',
			};
		}
		return {isValid: true};
	};

	return {
		email,setEmail, password, setPassword, resetForm, validate,
	};
};

export const useAuthenticate = () => 
{
	const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

	const authenticate = async (
		email: string,
		password: string,
		onSuccess: (response: any) => void
	) => 
	{
		setLoading(true); // Iniciar carga
		setError(null); // Resetear error
		try
		{
			const response =  await loginUser(email, password); // Llamada al servicio de login 

			console.log(response.data);

			onSuccess(response); // Ejecutar callback de éxito

			return response; // Devolver respuesta
		}catch (err: any)
		{
			const errorMessage = err.response?.data?.message || 'Error de autenticación';
			setError(errorMessage);
			throw err; // Re-lanzar error para manejo externo
		} finally
		{
			setLoading(false); // Finalizar carga en caso de error
		}
	};
    return {loading, error , authenticate};
}
