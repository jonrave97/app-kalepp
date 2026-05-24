import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import requireRole from '../middlewares/roleMiddleware.js';
import { getDashboardSummary } from '../controllers/dashboardController.js';

const router = Router();

router.use(authMiddleware);

router.get('/summary', requireRole('Administrador'), getDashboardSummary);

export default router;
