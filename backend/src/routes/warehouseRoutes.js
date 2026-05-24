import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import requireRole from '../middlewares/roleMiddleware.js';
import validateObjectId from '../middlewares/validateObjectId.js';
import {
    getWarehouses,
    getAllWarehouses,
    getWarehouseById,
    getMyWarehouse,
    createWarehouse,
    updateWarehouse,
    toggleWarehouse,
} from '../controllers/warehouseController.js';

const router = Router();

router.use(authMiddleware);

router.get('/my',           requireRole('Administrador', 'Encargado de Bodega'), getMyWarehouse);
router.get('/all',          getAllWarehouses);                                                     // todos los autenticados
router.get('/',             requireRole('Administrador'), getWarehouses);
router.get('/:id',          requireRole('Administrador', 'Encargado de Bodega'), validateObjectId, getWarehouseById);
router.post('/',            requireRole('Administrador'), createWarehouse);
router.put('/:id',          requireRole('Administrador'), validateObjectId, updateWarehouse);
router.patch('/:id/toggle', requireRole('Administrador'), validateObjectId, toggleWarehouse);

export default router;
