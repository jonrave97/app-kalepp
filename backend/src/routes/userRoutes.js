import {Router} from 'express';
import {loginUser, getProfile, logoutUser}  from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
    getUsers,
    getAllUsersMin,
    createUser,
    updateUser,
    toggleUser,
} from '../controllers/userController.js';
import User from '../models/userModel.js';
import Position from '../models/positionModel.js';

const router = Router();

router.post('/login', loginUser);

router.use(authMiddleware); // Proteger las rutas siguientes

// Rutas protegidas (ejemplo)
router.get('/profile', getProfile); // Obtener el perfil del usuario autenticado (Protegido)
router.patch('/profile/sizes', async (req, res) => {
    try {
        const { sizes } = req.body;
        const userId = req.userId;

        const user = await User.findByIdAndUpdate(
            userId,
            { sizes },
            { new: true, runValidators: true }
        )
        .select('-password -token')
        .populate('position', 'name')
        .populate('bosses._id', 'name email');

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Convertir a objeto plano y mapear position a string
        const userObject = user.toObject();
        const userResponse = {
            ...userObject,
            position: userObject.position?.name || null
        };

        res.json(userResponse);
    } catch (error) {
        console.error('Error al actualizar tallas:', error);
        res.status(500).json({ message: 'Error al actualizar tallas' });
    }
});
router.post('/logout', logoutUser);  // Cerrar sesión del usuario (Protegido)

// ── Rutas administración de usuarios ──────────────────────────────────────────
router.get('/admin/all',        getAllUsersMin);
router.get('/admin',            getUsers);
router.post('/admin',           createUser);
router.put('/admin/:id',        updateUser);
router.patch('/admin/:id/toggle', toggleUser);


export default router;