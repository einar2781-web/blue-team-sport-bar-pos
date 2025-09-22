import { Router } from 'express';
import { body, query, param, validationResult } from 'express-validator';

import { db } from '../config/database';
import redis from '../config/redis';
import { logger } from '../config/logger';
import { catchAsync, AppError } from '../middleware/errorHandler';
import { requireRole, requirePermission, requireSameOrganization } from '../middleware/auth';

const router = Router();

// Apply organization isolation to all routes
router.use(requireSameOrganization);

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/',
  requirePermission('view_products'),
  catchAsync(async (req, res) => {
    const { organizationId } = req.query;

    const categories = await db('categories')
      .select('*')
      .where('organization_id', organizationId)
      .where('is_active', true)
      .orderBy('sort_order')
      .orderBy('name');

    res.json({ categories });
  })
);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post('/',
  requirePermission('manage_products'),
  [
    body('name').notEmpty().withMessage('Category name is required'),
    body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color'),
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { organizationId } = req.query;
    const categoryData = {
      ...req.body,
      organization_id: organizationId,
    };

    const [category] = await db('categories').insert(categoryData).returning('*');

    logger.info(`Category created: ${category.name}`, {
      categoryId: category.id,
      organizationId,
      userId: req.user?.id,
    });

    res.status(201).json({
      message: 'Category created successfully',
      category,
    });
  })
);

export default router;