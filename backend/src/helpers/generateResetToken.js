import jwt from 'jsonwebtoken';

/**
 * Genera un JWT de un solo uso para restablecer contraseña.
 * Expira en 30 minutos. El claim `purpose` lo distingue del token de sesión.
 * @param {string} userId
 * @returns {string} JWT firmado
 */
const generateResetToken = (userId) => {
    return jwt.sign(
        { id: userId, purpose: 'password-reset' },
        process.env.JWT_SECRET,
        { expiresIn: '30m' }
    );
};

export default generateResetToken;
