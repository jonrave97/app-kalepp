import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import requireRole from '../middlewares/roleMiddleware.js';
import validateObjectId from '../middlewares/validateObjectId.js';
import {
    getEpps,
    getAllEpps,
    createEpp,
    updateEpp,
    toggleEpp,
} from '../controllers/eppController.js';

const router = Router();

router.use(authMiddleware);

router.get('/all',          getAllEpps);                                        // todos los autenticados
router.get('/',             requireRole('Administrador'), getEpps);
router.post('/',            requireRole('Administrador'), createEpp);
router.put('/:id',          requireRole('Administrador'), validateObjectId, updateEpp);
router.patch('/:id/toggle', requireRole('Administrador'), validateObjectId, toggleEpp);

export default router;
