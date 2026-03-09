import Request from '../models/requestModel.js';
import User from '../models/userModel.js';

// GET /api/requests/my-epps
export const getMyEpps = async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate({
            path: 'position',
            populate: {
                path: 'epps',
                model: 'Epps',
                match: { disabled: { $ne: true } },
                select: '_id code name',
            },
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(user.position?.epps ?? []);
    } catch (error) {
        console.error('Error al obtener EPPs del cargo:', error);
        res.status(500).json({ message: 'Error al obtener los EPPs' });
    }
};

// POST /api/requests
export const createRequest = async (req, res) => {
    try {
        const { warehouse, reason, epps } = req.body;

        // Validaciones básicas
        if (!warehouse) {
            return res.status(400).json({ message: 'La bodega es obligatoria' });
        }
        if (!reason) {
            return res.status(400).json({ message: 'El motivo es obligatorio' });
        }
        if (!Array.isArray(epps) || epps.length === 0) {
            return res.status(400).json({ message: 'Debe incluir al menos un EPP en la solicitud' });
        }

        // Validar que todas las cantidades sean > 0
        const invalidQty = epps.some(e => !e.eppId || !e.quantity || Number(e.quantity) < 1);
        if (invalidQty) {
            return res.status(400).json({ message: 'Todos los EPPs deben tener una cantidad mayor a 0' });
        }

        // Obtener el cargo del empleado autenticado con sus EPPs
        const user = await User.findById(req.userId).populate({
            path: 'position',
            populate: { path: 'epps', model: 'Epps', select: '_id' },
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Validar que todos los EPPs solicitados pertenezcan al cargo del trabajador
        const allowedIds = new Set((user.position?.epps ?? []).map(e => e._id.toString()));
        const unauthorized = epps.some(e => !allowedIds.has(e.eppId.toString()));
        if (unauthorized) {
            return res.status(403).json({ message: 'Uno o más EPPs no están permitidos para su cargo' });
        }

        const positionName = user.position?.name ?? '';

        const request = await Request.create({
            employee:  req.userId,
            position:  positionName,
            warehouse,
            reason,
            epps: epps.map(e => ({
                eppId:    e.eppId,
                quantity: Number(e.quantity),
            })),
        });

        res.status(201).json(request);
    } catch (error) {
        console.error('Error al crear solicitud:', error);
        if (error.name === 'ValidationError') {
            const msg = Object.values(error.errors)[0]?.message || 'Error de validación';
            return res.status(400).json({ message: msg });
        }
        res.status(500).json({ message: 'Error al crear la solicitud' });
    }
};
