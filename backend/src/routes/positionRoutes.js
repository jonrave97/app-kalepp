import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import requireRole from '../middlewares/roleMiddleware.js';
import validateObjectId from '../middlewares/validateObjectId.js';
import {
    getPositions,
    getAllPositions,
    createPosition,
    updatePosition,
    deletePosition,
    togglePosition,
} from '../controllers/positionController.js';

const router = Router();

router.use(authMiddleware);

router.get('/all',          getAllPositions);                                        // todos los autenticados
router.get('/',             requireRole('Administrador'), getPositions);
router.post('/',            requireRole('Administrador'), createPosition);
router.put('/:id',          requireRole('Administrador'), validateObjectId, updatePosition);
router.delete('/:id',       requireRole('Administrador'), validateObjectId, deletePosition);
router.patch('/:id/toggle', requireRole('Administrador'), validateObjectId, togglePosition);

export default router;
