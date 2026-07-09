import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Express Global Error Handling Middleware
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`Error processing request to ${req.method} ${req.url}:`, {
    message,
    status: statusCode,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
}
