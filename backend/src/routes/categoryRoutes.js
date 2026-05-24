import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import requireRole from '../middlewares/roleMiddleware.js';
import validateObjectId from '../middlewares/validateObjectId.js';
import {
    getCategories,
    getAllCategories,
    createCategory,
    updateCategory,
    toggleCategory,
} from '../controllers/categoryController.js';

const router = Router();

router.use(authMiddleware);

router.get('/all',          getAllCategories);                                        // todos los autenticados
router.get('/',             requireRole('Administrador'), getCategories);
router.post('/',            requireRole('Administrador'), createCategory);
router.put('/:id',          requireRole('Administrador'), validateObjectId, updateCategory);
router.patch('/:id/toggle', requireRole('Administrador'), validateObjectId, toggleCategory);

export default router;
