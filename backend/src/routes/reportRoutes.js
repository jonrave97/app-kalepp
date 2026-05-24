import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import requireRole from '../middlewares/roleMiddleware.js';
import { getUsersReport, getRequestsReport } from '../controllers/reportController.js';

const router = Router();

// Todas las rutas de reportes requieren autenticación + rol Administrador
router.use(authMiddleware, requireRole('Administrador'));

router.get('/users',    getUsersReport);
router.get('/requests', getRequestsReport);

export default router;

