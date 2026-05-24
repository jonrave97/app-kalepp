import jwt from 'jsonwebtoken';

/**
 * Genera un JWT de un solo uso para restablecer contraseña.
 * Expira en 30 minutos. Incluye una huella del hash actual de contraseña
 * para detectar si el enlace ya fue utilizado.
 * @param {string} userId
 * @param {string} passwordHash - Hash bcrypt actual del usuario
 * @returns {string} JWT firmado
 */
const generateResetToken = (userId, passwordHash) => {
    // Usamos los primeros 10 caracteres del hash como huella (fingerprint).
    // Si la contraseña cambia, el hash cambia y la huella ya no coincide.
    const fingerprint = passwordHash.slice(0, 10);

    return jwt.sign(
        { id: userId, purpose: 'password-reset', fingerprint },
        process.env.JWT_SECRET,
        { expiresIn: '30m' }
    );
};

export default generateResetToken;
