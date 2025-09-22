import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errorCode?: string;

  constructor(message: string, statusCode: number = 500, errorCode?: string) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = errorCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Database error handler
const handleDatabaseError = (error: any): AppError => {
  if (error.code === '23505') { // Unique violation
    const match = error.detail.match(/Key \(([^)]+)\)=\(([^)]+)\)/);
    const field = match ? match[1] : 'field';
    return new AppError(`Duplicate value for ${field}`, 409, 'DUPLICATE_VALUE');
  }
  
  if (error.code === '23503') { // Foreign key violation
    return new AppError('Referenced record does not exist', 400, 'FOREIGN_KEY_VIOLATION');
  }
  
  if (error.code === '23502') { // Not null violation
    const field = error.column || 'field';
    return new AppError(`${field} is required`, 400, 'REQUIRED_FIELD');
  }

  if (error.code === '42P01') { // Undefined table
    return new AppError('Database table not found', 500, 'TABLE_NOT_FOUND');
  }

  if (error.code === '42703') { // Undefined column
    return new AppError('Database column not found', 500, 'COLUMN_NOT_FOUND');
  }

  return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
};

// Validation error handler
const handleValidationError = (error: any): AppError => {
  if (error.details && Array.isArray(error.details)) {
    const messages = error.details.map((detail: any) => detail.message);
    return new AppError(`Validation failed: ${messages.join(', ')}`, 400, 'VALIDATION_ERROR');
  }
  
  return new AppError('Validation failed', 400, 'VALIDATION_ERROR');
};

// JWT error handler
const handleJWTError = (error: any): AppError => {
  if (error.name === 'TokenExpiredError') {
    return new AppError('Token has expired', 401, 'TOKEN_EXPIRED');
  }
  
  if (error.name === 'JsonWebTokenError') {
    return new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
  
  return new AppError('Authentication failed', 401, 'AUTH_ERROR');
};

// Rate limit error handler
const handleRateLimitError = (error: any): AppError => {
  return new AppError('Too many requests, please try again later', 429, 'RATE_LIMIT_EXCEEDED');
};

// File upload error handler
const handleMulterError = (error: any): AppError => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File too large', 413, 'FILE_TOO_LARGE');
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Too many files', 400, 'TOO_MANY_FILES');
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected file field', 400, 'UNEXPECTED_FILE');
  }
  
  return new AppError('File upload failed', 400, 'UPLOAD_ERROR');
};

// Send error response in development
const sendErrorDev = (err: AppError, res: Response): void => {
  res.status(err.statusCode).json({
    error: err.message,
    errorCode: err.errorCode,
    stack: err.stack,
    statusCode: err.statusCode,
    isOperational: err.isOperational,
  });
};

// Send error response in production
const sendErrorProd = (err: AppError, res: Response): void => {
  // Only send operational errors to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      error: err.message,
      errorCode: err.errorCode,
    });
  } else {
    // Log error and send generic message
    logger.error('Programming Error:', err);
    
    res.status(500).json({
      error: 'Something went wrong!',
      errorCode: 'INTERNAL_ERROR',
    });
  }
};

// Main error handler middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let err = error;

  // Log error with request context
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    organizationId: req.user?.organizationId,
  });

  // Convert known errors to AppError
  if (error.name === 'ValidationError' || error.isJoi) {
    err = handleValidationError(error);
  } else if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
    err = handleJWTError(error);
  } else if (error.code && error.code.startsWith('23')) { // PostgreSQL errors
    err = handleDatabaseError(error);
  } else if (error.code === 'EBADCSRFTOKEN') {
    err = new AppError('Invalid CSRF token', 403, 'INVALID_CSRF');
  } else if (error.type === 'entity.too.large') {
    err = new AppError('Request entity too large', 413, 'PAYLOAD_TOO_LARGE');
  } else if (error.type === 'entity.parse.failed') {
    err = new AppError('Invalid JSON payload', 400, 'INVALID_JSON');
  } else if (error.code && error.code.startsWith('LIMIT_')) { // Multer errors
    err = handleMulterError(error);
  } else if (error.message && error.message.includes('rate limit')) {
    err = handleRateLimitError(error);
  } else if (!(error instanceof AppError)) {
    // Convert unknown errors to AppError
    err = new AppError(
      process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      error.statusCode || 500,
      'UNKNOWN_ERROR'
    );
    err.isOperational = false;
  }

  // Send response based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};

// Async error handler wrapper
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler for routes not found
export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`,
    errorCode: 'ROUTE_NOT_FOUND',
  });
};

export default errorHandler;