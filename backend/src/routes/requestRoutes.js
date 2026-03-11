import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { createRequest, getMyEpps, upload } from '../controllers/requestController.js';

const router = Router();

router.use(authMiddleware);

router.get('/my-epps', getMyEpps);
router.post('/', upload.array('images', 5), createRequest);

export default router;
