import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getUserbyEmailWithPassword } from '../services/userServices.js';
import generateAuthToken from '../helpers/generateAuthToken.js';
import generateResetToken from '../helpers/generateResetToken.js';
import { sendPasswordResetEmail } from '../helpers/mailer.js';



export const profileCache = new Map();
const PROFILE_CACHE_TTL = 30_000; // 30 segundos

export const getProfile = async (req, res) => {
	try {
		const cached = profileCache.get(req.userId);
		if (cached && Date.now() - cached.ts < PROFILE_CACHE_TTL) {
			res.set('Cache-Control', 'private, max-age=30');
			return res.json(cached.data);
		}

		const user = await User.findById(req.userId)
			.select('-password -token')
			.populate('position', 'name')
			.populate('bosses._id', 'name email')
			.lean();

		if (!user) {
			return res.status(404).json({ message: 'Usuario no encontrado' });
		}

		const payload = {
			...user,
			position: user.position?.name ?? null,
			bosses: (user.bosses || []).map(b => ({ _id: b._id })),
		};

		profileCache.set(req.userId, { data: payload, ts: Date.now() });

		res.set('Cache-Control', 'private, max-age=30');
		res.json(payload);
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
			return res.status(401).json({ message: "Email o contraseña incorrectos" });
		}

		// Verificar la contraseña y compara con la almacenada
		const isMatch = await bcrypt.compare(password, userFound.password);
		if (!isMatch) {
			return res.status(401).json({ message: "Credenciales incorrectas" });
		}

		// Verificar que la cuenta esté activada
		if (!userFound.confirmed) {
			return res.status(403).json({ message: 'Tu cuenta aún no ha sido activada. Revisa tu correo electrónico para encontrar el enlace de activación.' });
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
		secure:   process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		expires:  new Date(0),
	});
	res.json({ message: "Logout exitoso" });
}

export const forgotPassword = async (req, res) => {
	const { email } = req.body;
	if (!email) return res.status(400).json({ message: 'El email es obligatorio' });

	try {
		// Seleccionamos password para poder generar la huella del token
		const user = await User.findOne({ email: email.trim().toLowerCase() })
			.select('_id name email disabled password');

		// Respuesta genérica para no revelar si el email existe
		if (!user || user.disabled) {
			return res.json({ message: 'Si el email existe, recibirás un enlace en breve' });
		}

		const resetToken = generateResetToken(user._id.toString(), user.password);
		const resetUrl   = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

		await sendPasswordResetEmail({ to: user.email, userName: user.name, resetUrl });

		return res.json({ message: 'Si el email existe, recibirás un enlace en breve' });
	} catch (error) {
		console.error('Error en forgotPassword:', error);
		return res.status(500).json({ message: 'Error al procesar la solicitud' });
	}
};

export const resetPassword = async (req, res) => {
	const { token }    = req.params;
	const { password } = req.body;

	if (!password || password.length < 8) {
		return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		if (decoded.purpose !== 'password-reset') {
			return res.status(400).json({ message: 'Token inválido' });
		}

		// Necesitamos el hash actual para verificar si el enlace ya fue usado
		const user = await User.findById(decoded.id).select('+password');
		if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

		// Si la huella del token no coincide con el hash actual, la contraseña
		// ya fue cambiada con este mismo enlace → enlace ya utilizado
		if (decoded.fingerprint && user.password.slice(0, 10) !== decoded.fingerprint) {
			return res.status(400).json({
				message: 'Este enlace ya fue utilizado. Solicita un nuevo correo para restablecer tu contraseña',
			});
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		user.password = hashedPassword;
		await user.save();

		return res.json({ message: 'Contraseña actualizada correctamente' });
	} catch (error) {
		if (error.name === 'TokenExpiredError') {
			return res.status(400).json({ message: 'El enlace ha expirado. Solicita uno nuevo' });
		}
		return res.status(400).json({ message: 'Token inválido' });
	}
};