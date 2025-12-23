import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { Error as MongooseError } from 'mongoose';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.error(`AppError: ${err.message}`, { statusCode: err.statusCode });
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Mongoose duplicate key error
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    return res.status(409).json({
      status: 'error',
      message: 'A record with this data already exists',
    });
  }

  // Mongoose validation error
  if (err instanceof MongooseError.ValidationError) {
    return res.status(400).json({
      status: 'error',
      message: err.message,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err instanceof MongooseError.CastError) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid ID format',
    });
  }

  logger.error('Unhandled error:', err);
  
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};
