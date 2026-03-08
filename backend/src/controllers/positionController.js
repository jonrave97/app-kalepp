import Position from '../models/positionModel.js';

const PAGE_SIZE = 10;

// GET /api/positions?page=1&search=texto
export const getPositions = async (req, res) => {
    try {
        const page   = Math.max(1, parseInt(req.query.page)   || 1);
        const search = (req.query.search || '').trim();

        const filter = search
            ? { name: { $regex: search, $options: 'i' } }
            : {};

        const total = await Position.countDocuments(filter);
        const positions = await Position.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        res.json({
            positions,
            total,
            page,
            totalPages: Math.ceil(total / PAGE_SIZE),
        });
    } catch (error) {
        console.error('Error al obtener positions:', error);
        res.status(500).json({ message: 'Error al obtener los cargos' });
    }
};

// POST /api/positions
export const createPosition = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'El nombre es obligatorio' });
        }

        const exists = await Position.findOne({ name: name.trim() });
        if (exists) {
            return res.status(400).json({ message: 'Ya existe un cargo con ese nombre' });
        }

        const position = await Position.create({ name: name.trim() });
        res.status(201).json(position);
    } catch (error) {
        console.error('Error al crear position:', error);
        res.status(500).json({ message: 'Error al crear el cargo' });
    }
};

// PUT /api/positions/:id
export const updatePosition = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'El nombre es obligatorio' });
        }

        const duplicate = await Position.findOne({
            name: name.trim(),
            _id: { $ne: req.params.id },
        });
        if (duplicate) {
            return res.status(400).json({ message: 'Ya existe un cargo con ese nombre' });
        }

        const position = await Position.findByIdAndUpdate(
            req.params.id,
            { name: name.trim() },
            { new: true, runValidators: true }
        );

        if (!position) {
            return res.status(404).json({ message: 'Cargo no encontrado' });
        }

        res.json(position);
    } catch (error) {
        console.error('Error al actualizar position:', error);
        res.status(500).json({ message: 'Error al actualizar el cargo' });
    }
};

// DELETE /api/positions/:id
export const deletePosition = async (req, res) => {
    try {
        const position = await Position.findByIdAndDelete(req.params.id);

        if (!position) {
            return res.status(404).json({ message: 'Cargo no encontrado' });
        }

        res.json({ message: 'Cargo eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar position:', error);
        res.status(500).json({ message: 'Error al eliminar el cargo' });
    }
};

// GET /api/positions/all — lista completa para selects (sin paginación)
export const getAllPositions = async (req, res) => {
    try {
        const positions = await Position.find({ disabled: { $ne: true } })
            .select('_id name')
            .sort({ name: 1 });
        res.json(positions);
    } catch (error) {
        console.error('Error al obtener todos los cargos:', error);
        res.status(500).json({ message: 'Error al obtener los cargos' });
    }
};

// PATCH /api/positions/:id/toggle
export const togglePosition = async (req, res) => {
    try {
        // Leer solo el campo necesario para invertirlo
        const current = await Position.findById(req.params.id).select('disabled');

        if (!current) {
            return res.status(404).json({ message: 'Cargo no encontrado' });
        }

        // findByIdAndUpdate con $set en un único campo +
        // runValidators: false evita que Mongoose intente castear
        // otros campos del documento (ej. epps ref:'Epp' sin schema registrado)
        const updated = await Position.findByIdAndUpdate(
            req.params.id,
            { $set: { disabled: !current.disabled } },
            { new: true, runValidators: false }
        );

        res.json(updated);
    } catch (error) {
        console.error('Error al cambiar estado de position:', error);
        res.status(500).json({ message: 'Error al cambiar el estado del cargo' });
    }
};
