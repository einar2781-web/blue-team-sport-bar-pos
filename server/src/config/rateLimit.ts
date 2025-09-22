import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import redis from './redis';

// Basic rate limit configuration for express-rate-limit
export const rateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req: Request) => {
    // Skip rate limiting for health checks and internal requests
    return req.path === '/health' || req.ip === '127.0.0.1' || req.ip === '::1';
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000),
    });
  },
};

// Simple rate limit helpers
export const createRateLimit = (windowMs: number, max: number, message: string) => {
  return {
    windowMs,
    max,
    message: {
      error: 'Rate limit exceeded',
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
  };
};

// Specific rate limiters
export const authRateLimit = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later.'
);

export const orderRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 orders
  'Too many orders created, please slow down.'
);

export const paymentRateLimit = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  5, // 5 attempts
  'Too many payment attempts, please try again later.'
);

export const uploadRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // 10 uploads
  'Too many file uploads, please try again later.'
);

export default rateLimitConfig;