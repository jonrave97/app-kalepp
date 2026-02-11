import jwt from 'jsonwebtoken';

/**
 * Genera un token JWT para autenticación de sesión
 * Este token se usa para login y se envía en cookies
 * @param {string} userId - El ID del usuario
 * @returns {string} Token JWT firmado que expira en 24 horas
 */
const generateAuthToken = (userId) => {
  return jwt.sign(
    { id: userId }, // Payload: ID del usuario
    process.env.JWT_SECRET, // Clave secreta desde variables de entorno
    { expiresIn: '24h' } // Token expira en 24 horas
  );
};

export default generateAuthToken;
