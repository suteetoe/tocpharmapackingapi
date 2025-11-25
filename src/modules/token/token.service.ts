import jwt from 'jsonwebtoken';
import { AppError } from '../../utils/AppError';
import config from '../../config/config';

export interface TokenPayload {
  id: number;
  user_name: string;
  role?: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwtSecret) as TokenPayload;
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
};
