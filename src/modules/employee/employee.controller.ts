import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';

export const validateEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employee_id } = req.body;

    if (!employee_id) {
      return next(new AppError('Please provide employee_id', 400));
    }

    const employee = await prisma.erpUser.findUnique({
      where: { code: employee_id },
    });

    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    res.status(200).json({
      success: true,
      employee: {
        code: employee.code,
        name: employee.name_1,
      },
    });
  } catch (error) {
    next(error);
  }
};
