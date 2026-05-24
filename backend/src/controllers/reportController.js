import User from '../models/userModel.js';
import Request from '../models/requestModel.js';

// Máximo de registros por reporte — protege memoria del servidor en producción
const REPORT_LIMIT = 5000;

// GET /api/reports/users — todos los usuarios para el reporte
export const getUsersReport = async (req, res) => {
    try {
        const total = await User.countDocuments();
        const users = await User.find()
            .select('-password -token -approvalToken -deliveryToken')
            .populate('position', 'name')
            .sort({ _id: -1 })
            .limit(REPORT_LIMIT)
            .lean();

        res.set('X-Report-Total',     String(total));
        res.set('X-Report-Truncated', String(total > REPORT_LIMIT));
        res.set('X-Report-Limit',     String(REPORT_LIMIT));
        res.json(users);
    } catch (error) {
        console.error('Error al generar reporte de usuarios:', error);
        res.status(500).json({ message: 'Error al generar el reporte de usuarios' });
    }
};

// GET /api/reports/requests?from=&to=&status=&warehouse= — solicitudes con filtros opcionales
export const getRequestsReport = async (req, res) => {
    try {
        const { from, to, status, warehouse } = req.query;
        const filter = {};

        // Filtro de rango de fechas
        if (from || to) {
            filter.date = {};
            if (from) filter.date.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                filter.date.$lte = toDate;
            }
        }

        // Filtro por estado
        if (status && status !== 'Todos') {
            filter.status = status;
        }

        // Filtro por bodega
        if (warehouse) {
            filter.warehouse = warehouse;
        }

        const total = await Request.countDocuments(filter);
        const requests = await Request.find(filter)
            .populate('employee', 'name email position')
            .populate('warehouse', 'code name')
            .populate('epps.epp', 'name code price')
            .sort({ date: -1, _id: -1 })
            .limit(REPORT_LIMIT)
            .lean();

        res.set('X-Report-Total',     String(total));
        res.set('X-Report-Truncated', String(total > REPORT_LIMIT));
        res.set('X-Report-Limit',     String(REPORT_LIMIT));
        res.json(requests);
    } catch (error) {
        console.error('Error al generar reporte de solicitudes:', error);
        res.status(500).json({ message: 'Error al generar el reporte de solicitudes' });
    }
};
