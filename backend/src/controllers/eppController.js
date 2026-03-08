import Epp from '../models/eppModel.js';

const PAGE_SIZE = 10;

// GET /api/epps?page=1&search=texto
export const getEpps = async (req, res) => {
    try {
        const page   = Math.max(1, parseInt(req.query.page) || 1);
        const search = (req.query.search || '').trim();

        const filter = search
            ? {
                $or: [
                    { code:     { $regex: search, $options: 'i' } },
                    { name:     { $regex: search, $options: 'i' } },
                    { category: { $regex: search, $options: 'i' } },
                ],
              }
            : {};

        const total = await Epp.countDocuments(filter);
        const epps  = await Epp.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        res.json({
            epps,
            total,
            page,
            totalPages: Math.ceil(total / PAGE_SIZE),
        });
    } catch (error) {
        console.error('Error al obtener EPPs:', error);
        res.status(500).json({ message: 'Error al obtener los EPPs' });
    }
};

// GET /api/epps/all — lista completa para selects (sin paginación)
export const getAllEpps = async (req, res) => {
    try {
        const epps = await Epp.find({ disabled: { $ne: true } })
            .select('_id code name')
            .sort({ name: 1 });
        res.json(epps);
    } catch (error) {
        console.error('Error al obtener todos los EPPs:', error);
        res.status(500).json({ message: 'Error al obtener los EPPs' });
    }
};

// POST /api/epps
export const createEpp = async (req, res) => {
    try {
        const { code, name, price, category } = req.body;

        if (!code || !code.trim()) {
            return res.status(400).json({ message: 'El código es obligatorio' });
        }
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'El nombre es obligatorio' });
        }
        if (price === undefined || price === null || price === '') {
            return res.status(400).json({ message: 'El precio es obligatorio' });
        }
        if (!category || !category.trim()) {
            return res.status(400).json({ message: 'La categoría es obligatoria' });
        }

        const exists = await Epp.findOne({ code: code.trim().toUpperCase() });
        if (exists) {
            return res.status(400).json({ message: 'Ya existe un EPP con ese código' });
        }

        const epp = await Epp.create({ code: code.trim(), name: name.trim(), price, category: category.trim() });
        res.status(201).json(epp);
    } catch (error) {
        console.error('Error al crear EPP:', error);
        res.status(500).json({ message: 'Error al crear el EPP' });
    }
};

// PUT /api/epps/:id
export const updateEpp = async (req, res) => {
    try {
        const { code, name, price, category } = req.body;

        if (!code || !code.trim()) {
            return res.status(400).json({ message: 'El código es obligatorio' });
        }
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'El nombre es obligatorio' });
        }
        if (price === undefined || price === null || price === '') {
            return res.status(400).json({ message: 'El precio es obligatorio' });
        }
        if (!category || !category.trim()) {
            return res.status(400).json({ message: 'La categoría es obligatoria' });
        }

        const duplicate = await Epp.findOne({
            code: code.trim().toUpperCase(),
            _id: { $ne: req.params.id },
        });
        if (duplicate) {
            return res.status(400).json({ message: 'Ya existe un EPP con ese código' });
        }

        const epp = await Epp.findByIdAndUpdate(
            req.params.id,
            { code: code.trim(), name: name.trim(), price, category: category.trim() },
            { new: true, runValidators: true },
        );

        if (!epp) {
            return res.status(404).json({ message: 'EPP no encontrado' });
        }

        res.json(epp);
    } catch (error) {
        console.error('Error al actualizar EPP:', error);
        res.status(500).json({ message: 'Error al actualizar el EPP' });
    }
};

// PATCH /api/epps/:id/toggle
export const toggleEpp = async (req, res) => {
    try {
        const epp = await Epp.findById(req.params.id);
        if (!epp) {
            return res.status(404).json({ message: 'EPP no encontrado' });
        }

        epp.disabled = !epp.disabled;
        await epp.save();

        res.json(epp);
    } catch (error) {
        console.error('Error al cambiar estado del EPP:', error);
        res.status(500).json({ message: 'Error al cambiar el estado del EPP' });
    }
};
