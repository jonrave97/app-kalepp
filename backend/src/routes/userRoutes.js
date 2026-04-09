import {Router} from 'express';
import {loginUser, getProfile, logoutUser, profileCache, forgotPassword, resetPassword}  from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
    getUsers,
    getAllUsersMin,
    getActiveUsers,
    createUser,
    updateUser,
    toggleUser,
} from '../controllers/userController.js';
import User from '../models/userModel.js';

const router = Router();

router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

router.use(authMiddleware); // Proteger las rutas siguientes

// Rutas protegidas (ejemplo)
router.get('/profile', getProfile); // Obtener el perfil del usuario autenticado (Protegido)
router.patch('/profile/sizes', async (req, res) => {
    try {
        const { sizes } = req.body;

        const user = await User.findByIdAndUpdate(
            req.userId,
            { sizes },
            { new: true, runValidators: true }
        )
        .select('-password -token')
        .populate('position', 'name')
        .populate('bosses._id', 'name email')
        .lean();

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const payload = {
            ...user,
            position: user.position?.name ?? null,
            bosses: (user.bosses || []).map(b => ({ _id: b._id })),
        };

        // Invalidar caché del servidor para este usuario
        profileCache.delete(req.userId);

        res.json(payload);
    } catch (error) {
        console.error('Error al actualizar tallas:', error);
        res.status(500).json({ message: 'Error al actualizar tallas' });
    }
});
router.post('/logout', logoutUser);  // Cerrar sesión del usuario (Protegido)

// ── Rutas administración de usuarios ──────────────────────────────────────────
router.get('/admin/active',     getActiveUsers);
router.get('/admin/all',        getAllUsersMin);
router.get('/admin',            getUsers);
router.post('/admin',           createUser);
router.put('/admin/:id',        updateUser);
router.patch('/admin/:id/toggle', toggleUser);


export default router;