import User from '../models/userModel.js';
import bcrypt from 'bcrypt';

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
            .sort({ createdAt: -1 })
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

// POST /api/users/admin
export const createUser = async (req, res) => {
    try {
        const { name, email, password, rol, position, company, area, warehouses, bosses } = req.body;

        if (!name?.trim()) return res.status(400).json({ message: 'El nombre es obligatorio' });
        if (!email?.trim()) return res.status(400).json({ message: 'El correo es obligatorio' });
        if (!password || password.length < 8) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
        }
        if (!rol) return res.status(400).json({ message: 'El rol es obligatorio' });
        if (!ROL_VALUES.includes(rol)) return res.status(400).json({ message: 'Rol no válido' });
        if (company && !COMPANY_VALUES.includes(company)) return res.status(400).json({ message: 'Empresa no válida' });

        const exists = await User.findOne({ email: email.trim().toLowerCase() });
        if (exists) return res.status(400).json({ message: 'Ya existe un usuario con ese correo' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name:       name.trim().toLowerCase(),
            email:      email.trim().toLowerCase(),
            password:   hashedPassword,
            rol,
            confirmed:  true,
            position:   position   || undefined,
            company:    company?.trim()  || undefined,
            area:       area?.trim()     || undefined,
            warehouses: warehouses || undefined,
            bosses:     (bosses || []).map(id => ({ _id: id })),
        });

        const populated = await User.findById(user._id)
            .select('-password -token')
            .populate('position', 'name');

        res.status(201).json(populated);
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ message: 'Error al crear el usuario' });
    }
};

// PUT /api/users/admin/:id
export const updateUser = async (req, res) => {
    try {
        const { name, email, password, rol, position, company, area, warehouses, bosses } = req.body;

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
            position:   position   || undefined,
            company:    company?.trim()  || undefined,
            area:       area?.trim()     || undefined,
            warehouses: warehouses || undefined,
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
