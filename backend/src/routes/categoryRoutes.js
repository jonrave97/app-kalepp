import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
    getCategories,
    getAllCategories,
    createCategory,
    updateCategory,
    toggleCategory,
} from '../controllers/categoryController.js';

const router = Router();

router.use(authMiddleware);

router.get('/all',          getAllCategories);
router.get('/',             getCategories);
router.post('/',            createCategory);
router.put('/:id',          updateCategory);
router.patch('/:id/toggle', toggleCategory);

export default router;
