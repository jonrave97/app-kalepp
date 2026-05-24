import { isValidObjectId } from 'mongoose';

/**
 * Middleware de validación de parámetro :id como MongoDB ObjectId.
 * Debe aplicarse en rutas que reciban un :id antes del controller.
 * Evita que Mongoose lance un CastError y devuelve un 400 claro en su lugar.
 *
 * @example router.get('/:id', validateObjectId, getWarehouseById);
 */
const validateObjectId = (req, res, next) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'ID inválido' });
    }
    next();
};

export default validateObjectId;

