import mongoose from 'mongoose';
import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { profileCache } from './authController.js';
import { sendActivationEmail } from '../helpers/mailer.js';

const ROL_VALUES = ['Trabajador', 'Jefatura', 'Encargado de Bodega', 'Administrador'];
const COMPANY_VALUES = ['Kal Tire', 'Kal Tire Recycling'];

const PAGE_SIZE = 10;

// GET /api/users/admin?page=1&search=texto
export const getUsers = async (req, res) => {
    try {
        const page   = Math.max(1, parseInt(req.query.page)   || 1);
        const search = (req.query.search || '').trim();

        const filter = search
            ? {
                $or: [
                    { name:  { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                ],
              }
            : {};

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select('-password -token')
            .populate('position', 'name')
            .sort({ createdAt: -1, _id: -1 })   // _id como secundario → sort siempre determinista
            .skip((page - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        res.json({
            users,
            total,
            page,
            totalPages: Math.ceil(total / PAGE_SIZE),
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error al obtener los usuarios' });
    }
};

// GET /api/users/admin/all — lista mínima para selects (Jefes)
export const getAllUsersMin = async (req, res) => {
    try {
        const users = await User.find({ rol: 'Jefatura', disabled: { $ne: true } })
            .select('_id name email')
            .sort({ name: 1 });
        res.json(users);
    } catch (error) {
        console.error('Error al obtener lista de usuarios:', error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

// GET /api/users/admin/active — lista de todos los usuarios habilitados
export const getActiveUsers = async (req, res) => {
    try {
        const users = await User.find({ disabled: { $ne: true } })
            .select('_id name email')
            .sort({ name: 1 });
        res.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios activos:', error);
        res.status(500).json({ message: 'Error al obtener los usuarios' });
    }
};

// POST /api/users/admin
export const createUser = async (req, res) => {
    try {
        const { name, email, rol, position, company, area, costCenter, warehouses, bosses } = req.body;

        if (!name?.trim()) return res.status(400).json({ message: 'El nombre es obligatorio' });
        if (!email?.trim()) return res.status(400).json({ message: 'El correo es obligatorio' });
        if (!rol) return res.status(400).json({ message: 'El rol es obligatorio' });
        if (!ROL_VALUES.includes(rol)) return res.status(400).json({ message: 'Rol no válido' });
        if (company && !COMPANY_VALUES.includes(company)) return res.status(400).json({ message: 'Empresa no válida' });

        const exists = await User.findOne({ email: email.trim().toLowerCase() });
        if (exists) return res.status(400).json({ message: 'Ya existe un usuario con ese correo' });

        // Contraseña aleatoria temporal — el usuario la reemplazará al activar la cuenta
        const randomPassword  = crypto.randomBytes(32).toString('hex');
        const hashedPassword  = await bcrypt.hash(randomPassword, 10);

        const user = await User.create({
            name:       name.trim().toLowerCase(),
            email:      email.trim().toLowerCase(),
            password:   hashedPassword,
            rol,
            confirmed:  false,
            position:   position             || undefined,
            company:    company?.trim()      || undefined,
            area:       area?.trim()         || undefined,
            costCenter: costCenter?.trim()   || undefined,
            warehouses: warehouses           || undefined,
            bosses:     (bosses || []).map(id => ({ _id: id })),
        });

        const populated = await User.findById(user._id)
            .select('-password -token')
            .populate('position', 'name');

        res.status(201).json(populated);

        // Enviar correo de activación de forma asíncrona
        _sendActivationEmailAsync(user).catch(err =>
            console.error('[mailer] Error al enviar correo de activación:', err)
        );

    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ message: 'Error al crear el usuario' });
    }
};

// POST /api/users/activate/:token — público, no requiere autenticación
export const activateAccount = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.length < 8) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(400).json({ message: 'El enlace de activación ha expirado. Contacta al administrador para solicitar uno nuevo.' });
            }
            return res.status(400).json({ message: 'Enlace de activación inválido.' });
        }

        if (decoded.purpose !== 'account-activation') {
            return res.status(400).json({ message: 'Enlace de activación inválido.' });
        }

        const user = await User.findById(decoded.id).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Verificar fingerprint — si no coincide, el enlace ya fue utilizado
        if (!user.password || user.password.slice(0, 10) !== decoded.fingerprint) {
            return res.status(400).json({ message: 'Este enlace ya fue utilizado. Tu cuenta ya está activa.' });
        }

        user.password  = await bcrypt.hash(password, 10);
        user.confirmed = true;
        user.token     = null;
        await user.save();

        return res.json({ message: 'Cuenta activada correctamente. Ya puedes iniciar sesión.' });
    } catch (error) {
        console.error('Error al activar cuenta:', error);
        res.status(500).json({ message: 'Error al activar la cuenta' });
    }
};

// PUT /api/users/admin/:id
export const updateUser = async (req, res) => {
    try {
        const { name, email, password, rol, position, company, area, costCenter, warehouses, bosses } = req.body;

        if (!name?.trim()) return res.status(400).json({ message: 'El nombre es obligatorio' });
        if (!email?.trim()) return res.status(400).json({ message: 'El correo es obligatorio' });
        if (!rol) return res.status(400).json({ message: 'El rol es obligatorio' });
        if (!ROL_VALUES.includes(rol)) return res.status(400).json({ message: 'Rol no válido' });
        if (company && !COMPANY_VALUES.includes(company)) return res.status(400).json({ message: 'Empresa no válida' });

        const duplicate = await User.findOne({
            email: email.trim().toLowerCase(),
            _id: { $ne: req.params.id },
        });
        if (duplicate) return res.status(400).json({ message: 'Ya existe un usuario con ese correo' });

        const updateData = {
            name:       name.trim().toLowerCase(),
            email:      email.trim().toLowerCase(),
            rol,
            position:   position             || undefined,
            company:    company?.trim()      || undefined,
            area:       area?.trim()         || undefined,
            costCenter: costCenter?.trim()   || undefined,
            warehouses: warehouses           || undefined,
            bosses:     (bosses || []).map(id => ({ _id: id })),
        };

        if (password && password.length >= 8) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await User.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        })
            .select('-password -token')
            .populate('position', 'name');

        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        res.json(user);
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ message: 'Error al actualizar el usuario' });
    }
};

// PATCH /api/users/profile/sizes
export const updateProfileSizes = async (req, res) => {
    try {
        const { sizes } = req.body;

        const user = await User.findByIdAndUpdate(
            req.userId,
            { sizes },
            { new: true, runValidators: true }
        )
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

        // Invalidar caché del servidor para este usuario
        profileCache.delete(req.userId);

        res.json(payload);
    } catch (error) {
        console.error('Error al actualizar tallas:', error);
        res.status(500).json({ message: 'Error al actualizar tallas' });
    }
};

// PATCH /api/users/admin/:id/toggle
export const toggleUser = async (req, res) => {
    try {
        const current = await User.findById(req.params.id).select('disabled');
        if (!current) return res.status(404).json({ message: 'Usuario no encontrado' });

        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { disabled: !current.disabled } },
            { new: true, runValidators: false }
        ).select('-password -token');

        res.json(updated);
    } catch (error) {
        console.error('Error al cambiar estado del usuario:', error);
        res.status(500).json({ message: 'Error al cambiar estado del usuario' });
    }
};

// GET /api/users/my-team — miembros del equipo del jefe autenticado
export const getMyTeam = async (req, res) => {
    try {
        const bossId  = new mongoose.Types.ObjectId(req.userId);
        const members = await User.find({ 'bosses._id': bossId, disabled: { $ne: true } })
            .select('-password -token')
            .populate('position', 'name')
            .sort({ name: 1 });
        res.json(members);
    } catch (error) {
        console.error('Error al obtener equipo:', error);
        res.status(500).json({ message: 'Error al obtener el equipo' });
    }
};

// ─── Internal: helper para enviar correo de activación ───────────────────────
async function _sendActivationEmailAsync(user) {
    const fingerprint    = user.password.slice(0, 10);
    const activationToken = jwt.sign(
        { id: user._id, purpose: 'account-activation', fingerprint },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
    const activationUrl = `${process.env.FRONTEND_URL}/activate/${activationToken}`;

    await sendActivationEmail({
        to:            user.email,
        userName:      user.name,
        activationUrl,
    });
}

