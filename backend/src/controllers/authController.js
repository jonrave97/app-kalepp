import User from '../models/userModel.js';
import Position from '../models/positionModel.js';
import bcrypt from 'bcrypt';
import { getUserbyEmailWithPassword } from '../services/userServices.js';
import generateAuthToken from '../helpers/generateAuthToken.js';



export const getProfile = async (req, res) => {
	try {
		// Obtener el perfil del usuario autenticado usando req.userId
		const user = await User.findById(req.userId)
			.select('-password -token')
			.populate('position', 'name')
			.populate('bosses._id', 'name email');

		if (!user) {
			return res.status(404).json({ message: 'Usuario no encontrado' });
		}
		
		// Convertir a objeto plano y mapear position a string
		const userObject = user.toObject();
		const userResponse = {
			...userObject,
			position: userObject.position?.name || null
		};
		
		res.json(userResponse);
	} catch (error) {
		console.error('Error al obtener perfil:', error);
		return res.status(500).json({ message: 'Error al obtener el perfil del usuario' });
	}
}



export const loginUser = async (req, res) => {
	const { email, password } = req.body;

	try {
		if (!email || !password) {
			return res
				.status(400)
				.json({ message: "El email y la contraseña son obligatorios" });
		}

		//Buscar el usuario por email (CON contraseña para validar)
		const userFound = await getUserbyEmailWithPassword(email.trim().toLowerCase());
		if (!userFound) {
			return res.status(401).json({ message: "Email o contraseña incorrectos a" });
		}

		// Verificar la contraseña y compara con la almacenada
		const isMatch = await bcrypt.compare(password, userFound.password);
		if (!isMatch) {
			return res.status(401).json({ message: "Credenciales incorrectas" });
		}

		// Poblar position para obtener el nombre del cargo
		await userFound.populate('position', 'name');

		// Generar token JWT para autenticación (sesión)
		const token = generateAuthToken(userFound._id);

		//Establecemos cookie con el token para enviar al cliente
		res.cookie('token', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production', // Solo enviar por HTTPS en producción
			sameSite: 'strict', // Protección CSRF
			maxAge: 24 * 60 * 60 * 1000 // 1 día
		});


		return res.status(200).json({
			message: "Login exitoso",
			user: {
				id: userFound._id,
				name: userFound.name,
				email: userFound.email,
				rol: userFound.rol,
				position: userFound.position?.name || null
			}
		});


	} catch (error) {
		console.error('Error al iniciar sesión:', error);
		return res.status(500).json({ message: "Error al iniciar sesión" });
	}
}

//Cerrar sesión
export const logoutUser = (req, res) => {
	res.cookie('token', '', {
		httpOnly: true,
		expires: new Date(0) // Establecer la cookie para que expire inmediatamente
	});
	res.json({ message: "Logout exitoso" });
}