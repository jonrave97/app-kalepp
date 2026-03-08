import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
    getEpps,
    getAllEpps,
    createEpp,
    updateEpp,
    toggleEpp,
} from '../controllers/eppController.js';

const router = Router();

router.use(authMiddleware);

router.get('/all',          getAllEpps);
router.get('/',             getEpps);
router.post('/',            createEpp);
router.put('/:id',          updateEpp);
router.patch('/:id/toggle', toggleEpp);

export default router;
