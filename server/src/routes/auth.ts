import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

import { db } from '../config/database';
import redis from '../config/redis';
import { logger } from '../config/logger';
import { generateToken, generateRefreshToken } from '../middleware/auth';
import { catchAsync, AppError } from '../middleware/errorHandler';
import { authRateLimit } from '../config/rateLimit';

const router = Router();

// Apply rate limiting to auth routes
const loginLimiter = rateLimit(authRateLimit);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               pinCode:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 6
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 *       429:
 *         description: Too many login attempts
 */
router.post('/login', 
  loginLimiter,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  catchAsync(async (req, res) => {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { email, password, pinCode } = req.body;

    // Find user by email
    const user = await db('users')
      .leftJoin('organizations', 'users.organization_id', 'organizations.id')
      .select(
        'users.*',
        'organizations.name as organization_name',
        'organizations.is_active as organization_active'
      )
      .where('users.email', email)
      .where('users.status', 'active')
      .first();

    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Check if organization is active
    if (!user.organization_active) {
      throw new AppError('Organization is not active', 401, 'ORGANIZATION_INACTIVE');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      // If PIN code is provided, verify it as alternative
      if (pinCode && user.pin_code) {
        const isPinValid = await bcrypt.compare(pinCode, user.pin_code);
        if (!isPinValid) {
          throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
        }
      } else {
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }
    }

    // Generate tokens
    const token = generateToken({
      userId: user.id,
      organizationId: user.organization_id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken();

    // Store refresh token in Redis with expiration
    await redis.set(`refresh_token:${user.id}`, refreshToken, 7 * 24 * 3600); // 7 days

    // Update last login
    await db('users')
      .where('id', user.id)
      .update({
        last_login_at: new Date(),
        updated_at: new Date(),
      });

    // Log successful login
    logger.info(`User ${user.email} logged in successfully`, {
      userId: user.id,
      organizationId: user.organization_id,
      role: user.role,
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        organizationId: user.organization_id,
        organizationName: user.organization_name,
      },
      tokens: {
        accessToken: token,
        refreshToken,
        expiresIn: '24h',
      },
    });
  })
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required'),
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { refreshToken } = req.body;

    // Find user by refresh token
    const userIds = await redis.getClient().keys('refresh_token:*');
    let userId: string | null = null;

    for (const key of userIds) {
      const storedToken = await redis.get(key);
      if (storedToken === refreshToken) {
        userId = key.replace('refresh_token:', '');
        break;
      }
    }

    if (!userId) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Get user data
    const user = await db('users')
      .select('id', 'organization_id', 'email', 'role', 'status')
      .where('id', userId)
      .where('status', 'active')
      .first();

    if (!user) {
      throw new AppError('User not found or inactive', 401, 'USER_NOT_FOUND');
    }

    // Generate new access token
    const newToken = generateToken({
      userId: user.id,
      organizationId: user.organization_id,
      email: user.email,
      role: user.role,
    });

    res.json({
      message: 'Token refreshed successfully',
      tokens: {
        accessToken: newToken,
        expiresIn: '24h',
      },
    });
  })
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout',
  catchAsync(async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET!) as any;
      
      // Blacklist the token
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      if (expiresIn > 0) {
        await redis.set(`blacklist:${token}`, 'true', expiresIn);
      }

      // Remove refresh token
      await redis.del(`refresh_token:${decoded.userId}`);

      logger.info(`User ${decoded.email} logged out successfully`, {
        userId: decoded.userId,
      });

      res.json({
        message: 'Logout successful',
      });
    } catch (error) {
      // Even if token is invalid, return success for logout
      res.json({
        message: 'Logout successful',
      });
    }
  })
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
router.post('/forgot-password',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { email } = req.body;

    // Find user by email
    const user = await db('users')
      .select('id', 'email', 'first_name')
      .where('email', email)
      .where('status', 'active')
      .first();

    // Always return success to prevent email enumeration
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });

    if (!user) {
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    // Generate reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 12);

    // Store reset token with 1 hour expiration
    await db('users')
      .where('id', user.id)
      .update({
        reset_password_token: resetTokenHash,
        reset_password_expires_at: new Date(Date.now() + 3600000), // 1 hour
        updated_at: new Date(),
      });

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(user.email, resetToken);

    logger.info(`Password reset requested for user: ${user.email}`, {
      userId: user.id,
    });
  })
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { token, password } = req.body;

    // Find user with valid reset token
    const user = await db('users')
      .select('id', 'email', 'reset_password_token')
      .where('reset_password_expires_at', '>', new Date())
      .whereNotNull('reset_password_token')
      .first();

    if (!user || !user.reset_password_token) {
      throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
    }

    // Verify reset token
    const isTokenValid = await bcrypt.compare(token, user.reset_password_token);
    if (!isTokenValid) {
      throw new AppError('Invalid reset token', 400, 'INVALID_RESET_TOKEN');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and clear reset token
    await db('users')
      .where('id', user.id)
      .update({
        password_hash: hashedPassword,
        reset_password_token: null,
        reset_password_expires_at: null,
        updated_at: new Date(),
      });

    // Invalidate all existing sessions for this user
    await redis.del(`refresh_token:${user.id}`);

    logger.info(`Password reset successful for user: ${user.email}`, {
      userId: user.id,
    });

    res.json({
      message: 'Password reset successful',
    });
  })
);

export default router;