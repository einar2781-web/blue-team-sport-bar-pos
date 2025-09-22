import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { logger } from '../config/logger';
import redis from '../config/redis';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        organizationId: string;
        email: string;
        role: string;
        permissions?: string[];
      };
    }
  }
}

export interface JWTPayload {
  userId: string;
  organizationId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Main authentication middleware
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided or invalid token format',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    // Check if token is blacklisted (logged out)
    const isBlacklisted = await redis.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has been invalidated',
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Get user from database to ensure they still exist and are active
    const user = await db('users')
      .select('id', 'organization_id', 'email', 'role', 'status', 'first_name', 'last_name')
      .where('id', decoded.userId)
      .where('status', 'active')
      .first();

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found or inactive',
      });
      return;
    }

    // Attach user info to request object
    req.user = {
      id: user.id,
      organizationId: user.organization_id,
      email: user.email,
      role: user.role,
    };

    // Update last activity
    await redis.set(`user_activity:${user.id}`, new Date().toISOString(), 3600);

    next();
  } catch (error: any) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired',
      });
      return;
    }
    
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication check failed',
    });
  }
};

// Role-based authorization middleware
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.id} with role ${req.user.role} to endpoint requiring roles: ${roles.join(', ')}`);
      
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required roles: ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
};

// Permission-based authorization middleware
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    try {
      // Get user permissions from cache or database
      let permissions = await redis.cacheGet<string[]>(`user_permissions:${req.user.id}`);
      
      if (!permissions) {
        // Load permissions from database (you can expand this based on your permission system)
        const rolePermissions = await getRolePermissions(req.user.role);
        permissions = rolePermissions;
        
        // Cache permissions for 1 hour
        await redis.cacheSet(`user_permissions:${req.user.id}`, permissions, 3600);
      }

      if (!permissions.includes(permission)) {
        logger.warn(`Access denied for user ${req.user.id} missing permission: ${permission}`);
        
        res.status(403).json({
          error: 'Forbidden',
          message: `Missing required permission: ${permission}`,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Permission check failed',
      });
    }
  };
};

// Organization isolation middleware
export const requireSameOrganization = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    return;
  }

  // Add organization filter to query parameters for route handlers to use
  req.query.organizationId = req.user.organizationId;
  next();
};

// Optional authentication middleware (for public endpoints that can benefit from user context)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    const user = await db('users')
      .select('id', 'organization_id', 'email', 'role', 'status')
      .where('id', decoded.userId)
      .where('status', 'active')
      .first();

    if (user) {
      req.user = {
        id: user.id,
        organizationId: user.organization_id,
        email: user.email,
        role: user.role,
      };
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional auth failed:', error);
  }

  next();
};

// Helper function to get role permissions
const getRolePermissions = async (role: string): Promise<string[]> => {
  const rolePermissions: Record<string, string[]> = {
    super_admin: [
      'manage_organizations',
      'manage_users',
      'view_all_reports',
      'manage_products',
      'manage_orders',
      'manage_payments',
      'manage_customers',
      'manage_inventory',
      'manage_settings',
      'view_analytics',
    ],
    admin: [
      'manage_users',
      'view_reports',
      'manage_products',
      'manage_orders',
      'manage_payments',
      'manage_customers',
      'manage_inventory',
      'manage_settings',
      'view_analytics',
    ],
    manager: [
      'view_reports',
      'manage_products',
      'manage_orders',
      'manage_customers',
      'view_inventory',
      'view_settings',
      'view_analytics',
    ],
    cashier: [
      'create_orders',
      'process_payments',
      'view_customers',
      'view_products',
    ],
    waiter: [
      'create_orders',
      'manage_tables',
      'view_customers',
      'view_products',
      'view_orders',
    ],
    kitchen: [
      'view_orders',
      'update_order_status',
      'view_products',
    ],
    bartender: [
      'view_orders',
      'update_order_status',
      'view_products',
    ],
  };

  return rolePermissions[role] || [];
};

// Utility function to generate JWT token
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

// Utility function to generate refresh token
export const generateRefreshToken = (): string => {
  return jwt.sign({}, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

export default authMiddleware;