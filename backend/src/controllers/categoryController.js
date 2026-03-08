import Category from '../models/categoryModel.js';

const PAGE_SIZE = 10;

// GET /api/categories?page=1&search=texto
export const getCategories = async (req, res) => {
    try {
        const page   = Math.max(1, parseInt(req.query.page)   || 1);
        const search = (req.query.search || '').trim();

        const filter = search
            ? { name: { $regex: search, $options: 'i' } }
            : {};

        const total = await Category.countDocuments(filter);
        const categories = await Category.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        res.json({
            categories,
            total,
            page,
            totalPages: Math.ceil(total / PAGE_SIZE),
        });
    } catch (error) {
        console.error('Error al obtener categories:', error);
        res.status(500).json({ message: 'Error al obtener las categorías' });
    }
};

// GET /api/categories/all — lista completa para selects (sin paginación)
export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({ disabled: { $ne: true } })
            .select('_id name')
            .sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        console.error('Error al obtener todas las categorías:', error);
        res.status(500).json({ message: 'Error al obtener las categorías' });
    }
};

// POST /api/categories
export const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'El nombre es obligatorio' });
        }

        const exists = await Category.findOne({ name: name.trim().toUpperCase() });
        if (exists) {
            return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
        }

        const category = await Category.create({ name: name.trim().toUpperCase() });
        res.status(201).json(category);
    } catch (error) {
        console.error('Error al crear category:', error);
        res.status(500).json({ message: 'Error al crear la categoría' });
    }
};

// PUT /api/categories/:id
export const updateCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'El nombre es obligatorio' });
        }

        const duplicate = await Category.findOne({
            name: name.trim().toUpperCase(),
            _id: { $ne: req.params.id },
        });
        if (duplicate) {
            return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name: name.trim().toUpperCase() },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }

        res.json(category);
    } catch (error) {
        console.error('Error al actualizar category:', error);
        res.status(500).json({ message: 'Error al actualizar la categoría' });
    }
};

// PATCH /api/categories/:id/toggle
export const toggleCategory = async (req, res) => {
    try {
        const current = await Category.findById(req.params.id).select('disabled');

        if (!current) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }

        const updated = await Category.findByIdAndUpdate(
            req.params.id,
            { $set: { disabled: !current.disabled } },
            { new: true, runValidators: false }
        );

        res.json(updated);
    } catch (error) {
        console.error('Error al cambiar estado de category:', error);
        res.status(500).json({ message: 'Error al cambiar el estado de la categoría' });
    }
};
