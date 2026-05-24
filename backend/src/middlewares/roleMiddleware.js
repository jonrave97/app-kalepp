/**
 * Middleware de autorización por rol.
 * Debe usarse DESPUÉS de authMiddleware, que es quien adjunta req.userRole.
 *
 * @param {...string} roles - Roles permitidos para la ruta
 * @example router.post('/', requireRole('Administrador'), createCategory);
 * @example router.get('/:id', requireRole('Administrador', 'Encargado de Bodega'), getWarehouseById);
 */
const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.userRole)) {
        return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
    }
    next();
};

export default requireRole;

