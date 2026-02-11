import User from '../models/userModel.js';

// Recuperar usuario por email CON CONTRASEÑA (para login/validación)
export const getUserbyEmailWithPassword = async (email) => {
    
  return await User.findOne({ email: email });
};

// export const getUserOne = async (id) => {
//   return await User.findById(id).select('-password');
// };

// //recuperar usuario por email (SIN CONTRASEÑA - para listar usuarios)
// export const getUserbyEmail = async (email) => {
//   return await User.findOne({ email: email }).select('-password');
// };