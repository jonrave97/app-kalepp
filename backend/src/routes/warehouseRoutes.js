import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
    getWarehouses,
    getAllWarehouses,
    getWarehouseById,
    createWarehouse,
    updateWarehouse,
    toggleWarehouse,
} from '../controllers/warehouseController.js';

const router = Router();

router.use(authMiddleware);

router.get('/all',          getAllWarehouses);
router.get('/',             getWarehouses);
router.get('/:id',          getWarehouseById);
router.post('/',            createWarehouse);
router.put('/:id',          updateWarehouse);
router.patch('/:id/toggle', toggleWarehouse);

export default router;
