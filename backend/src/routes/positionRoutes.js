import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
    getPositions,
    createPosition,
    updatePosition,
    deletePosition,
    togglePosition,
} from '../controllers/positionController.js';

const router = Router();

router.use(authMiddleware);

router.get('/',          getPositions);
router.post('/',         createPosition);
router.put('/:id',       updatePosition);
router.delete('/:id',    deletePosition);
router.patch('/:id/toggle', togglePosition);

export default router;
