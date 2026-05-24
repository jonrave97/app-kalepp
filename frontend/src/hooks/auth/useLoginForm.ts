import { loginUser } from '@/services/authServices';
import {useState} from 'react';


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
		onSuccess: (response: unknown) => void | Promise<void>
	) =>
	{
		setLoading(true); // Iniciar carga
		setError(null); // Resetear error
		try
		{
			const response = await loginUser(email, password);


			onSuccess(response); // Ejecutar callback de éxito

			return response; // Devolver respuesta
		}catch (err: unknown)
		{
			const axiosErr = err as { response?: { data?: { message?: string } } };
			const errorMessage = axiosErr.response?.data?.message || 'Error de autenticación';
			setError(errorMessage);
			throw err; // Re-lanzar error para manejo externo
		} finally
		{
			setLoading(false); // Finalizar carga en caso de error
		}
	};
    return {loading, error , authenticate};
}
