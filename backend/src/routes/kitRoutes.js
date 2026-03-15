import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { getKits, getAllKits, createKit, updateKit, toggleKit, deleteKit } from '../controllers/kitController.js';

const router = Router();

router.use(authMiddleware);

router.get('/all',          getAllKits);
router.get('/',             getKits);
router.post('/',            createKit);
router.put('/:id',          updateKit);
router.patch('/:id/toggle', toggleKit);
router.delete('/:id',       deleteKit);

export default router;
