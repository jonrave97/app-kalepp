import jwt from 'jsonwebtoken';

/**
 * Middleware de autenticación
 * Verifica que el usuario tenga un token válido en las cookies
 * antes de permitir el acceso a rutas protegidas
 */
const authMiddleware = (req, res, next) => {
  // Leer el token desde las cookies (no desde headers Authorization)
  const token = req.cookies.token;
  
  // Si no existe el token, rechazar la petición
  if (!token) {
    return res.status(401).json({ 
      message: 'No autorizado - Token no proporcionado' 
    });
  }

  try {
    // Verificar que el token sea válido y no haya expirado
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adjuntar el ID del usuario al objeto req
    // Esto permite que los controladores accedan a req.userId
    req.userId = decoded.id;
    
    // Si todo está correcto, continuar al siguiente middleware o controlador
    next();
    
  } catch (error) {
    // Si el token es inválido, está manipulado o expiró
    return res.status(401).json({ 
      message: 'Token inválido o expirado' 
    });
  }
};

export default authMiddleware;
