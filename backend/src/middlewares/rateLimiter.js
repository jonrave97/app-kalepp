import rateLimit from 'express-rate-limit';

/**
 * Rate limiter para el endpoint de login.
 * Máximo 10 intentos por IP cada 15 minutos.
 * Protege contra ataques de fuerza bruta.
 */
export const loginLimiter = rateLimit({
    windowMs:       15 * 60 * 1000, // 15 minutos
    max:            10,
    standardHeaders: true,           // Exponer RateLimit-* headers estándar
    legacyHeaders:  false,           // Deshabilitar X-RateLimit-* headers deprecados
    message:        { message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos' },
});

/**
 * Rate limiter para los endpoints de recuperación y cambio de contraseña.
 * Máximo 5 solicitudes por IP cada 10 minutos.
 * Protege contra spam de correos y abuso del flujo de reset.
 */
export const passwordResetLimiter = rateLimit({
    windowMs:       10 * 60 * 1000, // 10 minutos
    max:            5,
    standardHeaders: true,
    legacyHeaders:  false,
    message:        { message: 'Demasiadas solicitudes. Intenta de nuevo en 10 minutos' },
});

