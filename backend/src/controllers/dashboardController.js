import User      from '../models/userModel.js';
import Warehouse  from '../models/warehouseModel.js';
import Epp        from '../models/eppModel.js';
import Category   from '../models/categoryModel.js';
import Position   from '../models/positionModel.js';

// GET /api/dashboard/summary
export const getDashboardSummary = async (req, res) => {
    try {
        const [
            totalUsers,
            enabledUsers,
            disabledUsers,
            notActivatedUsers,
            totalWarehouses,
            enabledWarehouses,
            totalEpps,
            activeEpps,
            totalCategories,
            totalPositions,
        ] = await Promise.all([
            User.countDocuments({}),
            User.countDocuments({ disabled: false }),
            User.countDocuments({ disabled: true }),
            User.countDocuments({ confirmed: false }),
            Warehouse.countDocuments({}),
            Warehouse.countDocuments({ disabled: false }),
            Epp.countDocuments({}),
            Epp.countDocuments({ disabled: false }),
            Category.countDocuments({}),
            Position.countDocuments({}),
        ]);

        res.json({
            users: {
                total:        totalUsers,
                enabled:      enabledUsers,
                disabled:     disabledUsers,
                notActivated: notActivatedUsers,
            },
            warehouses: {
                total:    totalWarehouses,
                enabled:  enabledWarehouses,
                disabled: totalWarehouses - enabledWarehouses,
            },
            epps: {
                total:    totalEpps,
                active:   activeEpps,
                inactive: totalEpps - activeEpps,
            },
            categories: { total: totalCategories },
            positions:  { total: totalPositions },
        });
    } catch (error) {
        console.error('Error al obtener resumen del dashboard:', error);
        res.status(500).json({ message: 'Error al obtener el resumen del dashboard' });
    }
};
