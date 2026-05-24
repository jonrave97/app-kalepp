import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

/**
 * Middleware de autenticación
 * Verifica que el usuario tenga un token válido en las cookies,
 * que exista en la DB y no esté deshabilitado.
 * Adjunta req.userId, req.userRole y req.userWarehouse para uso
 * en middlewares y controllers posteriores.
 */
const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'No autorizado - Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Obtener rol, bodega asignada y estado del usuario desde DB
        const user = await User.findById(decoded.id).select('rol warehouses disabled');

        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        if (user.disabled) {
            return res.status(401).json({ message: 'Tu cuenta ha sido deshabilitada' });
        }

        req.userId        = decoded.id;
        req.userRole      = user.rol;
        req.userWarehouse = user.warehouses;

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

export default authMiddleware;
