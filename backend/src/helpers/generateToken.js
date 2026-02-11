import { v4 as uuidv4 } from 'uuid';

/**
 * Genera un token único utilizando UUID v4.
 * @returns {string} Una cadena UUID v4 generada aleatoriamente.
 */
const generateToken = () => {
  return uuidv4();
};

export default generateToken;