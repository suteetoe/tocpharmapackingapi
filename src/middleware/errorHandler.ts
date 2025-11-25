import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import config from '../config/config';

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let status = 'error';
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    status = err.status;
    message = err.message;
  } else {
    console.error('ERROR 💥', err);
    message = err.message; // In production, you might want to hide this
  }

  res.status(statusCode).json({
    status,
    message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
  });
};
