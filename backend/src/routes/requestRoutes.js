import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { createRequest, getMyEpps, getRequests, deleteRequest, upload } from '../controllers/requestController.js';

const router = Router();

router.use(authMiddleware);

router.get('/my-epps', getMyEpps);
router.get('/',        getRequests);
router.post('/',       upload.array('images', 5), createRequest);
router.delete('/:id',  deleteRequest);

export default router;
