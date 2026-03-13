import Warehouse from '../models/warehouseModel.js';

const PAGE_SIZE = 10;

// GET /api/warehouses?page=1&search=texto
export const getWarehouses = async (req, res) => {
    try {
        const page   = Math.max(1, parseInt(req.query.page)   || 1);
        const search = (req.query.search || '').trim();

        const filter = search
            ? {
                $or: [
                    { code: { $regex: search, $options: 'i' } },
                    { name: { $regex: search, $options: 'i' } },
                ],
              }
            : {};

        const total = await Warehouse.countDocuments(filter);
        const warehouses = await Warehouse.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        res.json({
            warehouses,
            total,
            page,
            totalPages: Math.ceil(total / PAGE_SIZE),
        });
    } catch (error) {
        console.error('Error al obtener warehouses:', error);
        res.status(500).json({ message: 'Error al obtener las bodegas' });
    }
};

// GET /api/warehouses/all — lista completa para selects (sin paginación)
export const getAllWarehouses = async (req, res) => {
    try {
        const warehouses = await Warehouse.find({ disabled: { $ne: true } })
            .select('_id code name')
            .sort({ name: 1 });
        res.json(warehouses);
    } catch (error) {
        console.error('Error al obtener todas las bodegas:', error);
        res.status(500).json({ message: 'Error al obtener las bodegas' });
    }
};

// POST /api/warehouses
export const createWarehouse = async (req, res) => {
    try {
        const { code, name } = req.body;

        if (!code || !code.trim()) {
            return res.status(400).json({ message: 'El código es obligatorio' });
        }
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'El nombre es obligatorio' });
        }

        const codeExists = await Warehouse.findOne({ code: code.trim().toUpperCase() });
        if (codeExists) {
            return res.status(400).json({ message: 'Ya existe una bodega con ese código' });
        }

        const nameExists = await Warehouse.findOne({ name: name.trim() });
        if (nameExists) {
            return res.status(400).json({ message: 'Ya existe una bodega con ese nombre' });
        }

        const warehouse = await Warehouse.create({
            code: code.trim().toUpperCase(),
            name: name.trim(),
        });

        res.status(201).json(warehouse);
    } catch (error) {
        console.error('Error al crear warehouse:', error);
        res.status(500).json({ message: 'Error al crear la bodega' });
    }
};

// PUT /api/warehouses/:id
export const updateWarehouse = async (req, res) => {
    try {
        const { code, name } = req.body;

        if (!code || !code.trim()) {
            return res.status(400).json({ message: 'El código es obligatorio' });
        }
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'El nombre es obligatorio' });
        }

        const codeDuplicate = await Warehouse.findOne({
            code: code.trim().toUpperCase(),
            _id: { $ne: req.params.id },
        });
        if (codeDuplicate) {
            return res.status(400).json({ message: 'Ya existe una bodega con ese código' });
        }

        const nameDuplicate = await Warehouse.findOne({
            name: name.trim(),
            _id: { $ne: req.params.id },
        });
        if (nameDuplicate) {
            return res.status(400).json({ message: 'Ya existe una bodega con ese nombre' });
        }

        const warehouse = await Warehouse.findByIdAndUpdate(
            req.params.id,
            {
                code: code.trim().toUpperCase(),
                name: name.trim(),
            },
            { new: true, runValidators: true }
        );

        if (!warehouse) {
            return res.status(404).json({ message: 'Bodega no encontrada' });
        }

        res.json(warehouse);
    } catch (error) {
        console.error('Error al actualizar warehouse:', error);
        res.status(500).json({ message: 'Error al actualizar la bodega' });
    }
};

// GET /api/warehouses/:id
export const getWarehouseById = async (req, res) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id);
        if (!warehouse) {
            return res.status(404).json({ message: 'Bodega no encontrada' });
        }
        res.json(warehouse);
    } catch (error) {
        console.error('Error al obtener bodega:', error);
        res.status(500).json({ message: 'Error al obtener la bodega' });
    }
};

// PATCH /api/warehouses/:id/toggle
export const toggleWarehouse = async (req, res) => {
    try {
        const current = await Warehouse.findById(req.params.id).select('disabled');

        if (!current) {
            return res.status(404).json({ message: 'Bodega no encontrada' });
        }

        const updated = await Warehouse.findByIdAndUpdate(
            req.params.id,
            { $set: { disabled: !current.disabled } },
            { new: true, runValidators: false }
        );

        res.json(updated);
    } catch (error) {
        console.error('Error al cambiar estado de warehouse:', error);
        res.status(500).json({ message: 'Error al cambiar el estado de la bodega' });
    }
};
