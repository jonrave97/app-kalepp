import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { createRequest, getMyEpps } from '../controllers/requestController.js';

const router = Router();

router.use(authMiddleware);

router.get('/my-epps', getMyEpps);
router.post('/', createRequest);

export default router;
