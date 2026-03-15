import Kit from '../models/kitModel.js';

const PAGE_SIZE = 10;

// GET /api/kits?page=1&search=texto
export const getKits = async (req, res) => {
    try {
        const page   = Math.max(1, parseInt(req.query.page) || 1);
        const search = (req.query.search || '').trim();
        const filter = search ? { name: { $regex: search, $options: 'i' } } : {};

        const total = await Kit.countDocuments(filter);
        const kits  = await Kit.find(filter)
            .populate('epps.epp', 'name code')
            .sort({ createdAt: -1 })
            .skip((page - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        res.json({ kits, total, page, totalPages: Math.ceil(total / PAGE_SIZE) });
    } catch (error) {
        console.error('Error al obtener kits:', error);
        res.status(500).json({ message: 'Error al obtener los kits' });
    }
};

// GET /api/kits/all — active kits for selects
export const getAllKits = async (req, res) => {
    try {
        const kits = await Kit.find({ active: true })
            .populate('epps.epp', '_id name code')
            .select('name description epps')
            .sort({ name: 1 });
        res.json(kits);
    } catch (error) {
        console.error('Error al obtener todos los kits:', error);
        res.status(500).json({ message: 'Error al obtener los kits' });
    }
};

// POST /api/kits
export const createKit = async (req, res) => {
    try {
        const { name, description, epps } = req.body;
        if (!name?.trim()) {
            return res.status(400).json({ message: 'El nombre del kit es obligatorio' });
        }
        const kit = await Kit.create({
            name:        name.trim(),
            description: description?.trim() ?? '',
            epps:        epps ?? [],
        });
        res.status(201).json(kit);
    } catch (error) {
        console.error('Error al crear kit:', error);
        res.status(500).json({ message: 'Error al crear el kit' });
    }
};

// PUT /api/kits/:id
export const updateKit = async (req, res) => {
    try {
        const { name, description, epps } = req.body;
        if (!name?.trim()) {
            return res.status(400).json({ message: 'El nombre del kit es obligatorio' });
        }
        const kit = await Kit.findByIdAndUpdate(
            req.params.id,
            { name: name.trim(), description: description?.trim() ?? '', epps: epps ?? [] },
            { new: true, runValidators: true }
        );
        if (!kit) return res.status(404).json({ message: 'Kit no encontrado' });
        res.json(kit);
    } catch (error) {
        console.error('Error al actualizar kit:', error);
        res.status(500).json({ message: 'Error al actualizar el kit' });
    }
};

// PATCH /api/kits/:id/toggle
export const toggleKit = async (req, res) => {
    try {
        const kit = await Kit.findById(req.params.id);
        if (!kit) return res.status(404).json({ message: 'Kit no encontrado' });
        kit.active = !kit.active;
        await kit.save();
        res.json(kit);
    } catch (error) {
        console.error('Error al cambiar estado del kit:', error);
        res.status(500).json({ message: 'Error al cambiar el estado del kit' });
    }
};

// DELETE /api/kits/:id
export const deleteKit = async (req, res) => {
    try {
        const kit = await Kit.findByIdAndDelete(req.params.id);
        if (!kit) return res.status(404).json({ message: 'Kit no encontrado' });
        res.json({ message: 'Kit eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar kit:', error);
        res.status(500).json({ message: 'Error al eliminar el kit' });
    }
};
