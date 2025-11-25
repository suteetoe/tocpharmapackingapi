import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { generateToken } from '../token/token.service';
import { AppError } from '../../utils/AppError';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return next(new AppError('Please provide username and password', 400));
    }

    // Check if user exists
    const user = await prisma.misUser.findUnique({
      where: { user_name: username },
    });

    if (!user || password !== user.password) {
      return next(new AppError('Incorrect username or password', 401));
    }

    // Generate token
    const token = generateToken({
      id: user.roworder,
      user_name: user.user_name,
      // role: user.role // Assuming role exists in MisUser or derived logic
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.roworder.toString(),
        username: user.user_name,
        role: 'user', // Placeholder as role is not in schema yet
      },
    });
  } catch (error) {
    next(error);
  }
};
