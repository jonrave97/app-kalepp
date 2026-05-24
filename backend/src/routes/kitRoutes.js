import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import requireRole from '../middlewares/roleMiddleware.js';
import validateObjectId from '../middlewares/validateObjectId.js';
import { getKits, getAllKits, createKit, updateKit, toggleKit, deleteKit } from '../controllers/kitController.js';

const router = Router();

router.use(authMiddleware);

router.get('/all',          getAllKits);                                        // todos los autenticados
router.get('/',             requireRole('Administrador'), getKits);
router.post('/',            requireRole('Administrador'), createKit);
router.put('/:id',          requireRole('Administrador'), validateObjectId, updateKit);
router.patch('/:id/toggle', requireRole('Administrador'), validateObjectId, toggleKit);
router.delete('/:id',       requireRole('Administrador'), validateObjectId, deleteKit);

export default router;
