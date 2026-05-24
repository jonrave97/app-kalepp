import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import requireRole from '../middlewares/roleMiddleware.js';
import validateObjectId from '../middlewares/validateObjectId.js';
import { createRequest, getMyEpps, getRequests, deleteRequest, deliverRequest, reportNoStock, annulRequest, getRequestPdf, upload } from '../controllers/requestController.js';

const router = Router();

router.use(authMiddleware);

router.get('/my-epps',         getMyEpps);
router.get('/',                getRequests);
router.get('/:id/pdf',         validateObjectId, getRequestPdf);
router.post('/',               upload.array('images', 5), createRequest);
router.patch('/:id/deliver',   requireRole('Encargado de Bodega'), validateObjectId, deliverRequest);
router.patch('/:id/no-stock',  requireRole('Encargado de Bodega'), validateObjectId, reportNoStock);
router.patch('/:id/annul',     requireRole('Encargado de Bodega'), validateObjectId, annulRequest);
router.delete('/:id',          requireRole('Administrador'),        validateObjectId, deleteRequest);

export default router;
