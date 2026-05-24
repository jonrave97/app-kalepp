import {Router} from 'express';
import {loginUser, getProfile, logoutUser, forgotPassword, resetPassword}  from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import requireRole from '../middlewares/roleMiddleware.js';
import validateObjectId from '../middlewares/validateObjectId.js';
import { loginLimiter, passwordResetLimiter } from '../middlewares/rateLimiter.js';
import {
    getUsers,
    getAllUsersMin,
    getActiveUsers,
    createUser,
    updateUser,
    toggleUser,
    updateProfileSizes,
    activateAccount,
    getMyTeam,
} from '../controllers/userController.js';

const router = Router();

router.post('/login',                  loginLimiter,          loginUser);
router.post('/forgot-password',        passwordResetLimiter,  forgotPassword);
router.post('/reset-password/:token',  passwordResetLimiter,  resetPassword);
router.post('/activate/:token',        passwordResetLimiter,  activateAccount);

router.use(authMiddleware); // Proteger las rutas siguientes

// ── Perfil (todos los autenticados) ───────────────────────────────────────────
router.get('/profile', getProfile);
router.patch('/profile/sizes', updateProfileSizes);
router.post('/logout', logoutUser);
router.get('/my-team', requireRole('Jefatura'), getMyTeam);

// ── Rutas de administración de usuarios ───────────────────────────────────────
router.get('/admin/active',       getActiveUsers);
router.get('/admin/all',          getAllUsersMin);
router.get('/admin',              requireRole('Administrador'), getUsers);
router.post('/admin',             requireRole('Administrador'), createUser);
router.put('/admin/:id',          requireRole('Administrador'), validateObjectId, updateUser);
router.patch('/admin/:id/toggle', requireRole('Administrador'), validateObjectId, toggleUser);


export default router;