export interface UserSizes {
  /** Talla de calzado (número) */
  footwear?: string;
  /** Talla de guantes (número) */
  gloves?: string;
  /** Talla de pantalones */
  pants?: {
    /** Letra de la talla (S, M, L, XL, etc.) */
    letter?: string;
    /** Número de la talla */
    number?: string;
  };
  /** Talla de camisa/chaqueta (S, M, L, XL, etc.) */
  shirtJacket?: string;
}