import { Router } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';

import { db } from '../config/database';
import redis from '../config/redis';
import { logger } from '../config/logger';
import { catchAsync, AppError } from '../middleware/errorHandler';
import { requireRole, requirePermission, requireSameOrganization } from '../middleware/auth';

const router = Router();

// Apply organization isolation to all routes
router.use(requireSameOrganization);

// File upload configuration
const upload = multer({
  memory: true,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, unavailable, 86ed]
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in product name and description
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of products
 *       401:
 *         description: Unauthorized
 */
router.get('/',
  requirePermission('view_products'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category_id').optional().isUUID(),
    query('status').optional().isIn(['available', 'unavailable', '86ed']),
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const {
      category_id,
      status,
      search,
      page = 1,
      limit = 50,
      organizationId
    } = req.query as any;

    // Check cache first
    const cacheKey = `products:${organizationId}:${JSON.stringify(req.query)}`;
    const cachedProducts = await redis.cacheGet(cacheKey);
    if (cachedProducts) {
      return res.json(cachedProducts);
    }

    let query = db('products')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .select(
        'products.id',
        'products.sku',
        'products.name',
        'products.description',
        'products.short_description',
        'products.type',
        'products.price',
        'products.cost',
        'products.tax_included',
        'products.tax_rate',
        'products.image_url',
        'products.prep_time',
        'products.calories',
        'products.allergens',
        'products.ingredients',
        'products.is_spicy',
        'products.is_vegetarian',
        'products.is_vegan',
        'products.is_gluten_free',
        'products.status',
        'products.sort_order',
        'products.is_active',
        'products.created_at',
        'products.updated_at',
        'categories.name as category_name',
        'categories.color as category_color'
      )
      .where('products.organization_id', organizationId)
      .where('products.is_active', true)
      .orderBy('products.sort_order')
      .orderBy('products.name');

    // Apply filters
    if (category_id) {
      query = query.where('products.category_id', category_id);
    }

    if (status) {
      query = query.where('products.status', status);
    }

    if (search) {
      query = query.where(function() {
        this.where('products.name', 'ilike', `%${search}%`)
            .orWhere('products.description', 'ilike', `%${search}%`)
            .orWhere('products.sku', 'ilike', `%${search}%`);
      });
    }

    // Get total count for pagination
    const totalQuery = query.clone().clearSelect().clearOrder().count('* as total');
    const [{ total }] = await totalQuery;

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.offset(offset).limit(parseInt(limit));

    const products = await query;

    const result = {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total as string),
        totalPages: Math.ceil(parseInt(total as string) / parseInt(limit)),
      },
    };

    // Cache for 5 minutes
    await redis.cacheSet(cacheKey, result, 300);

    res.json(result);
  })
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a specific product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/:id',
  requirePermission('view_products'),
  [
    param('id').isUUID().withMessage('Invalid product ID'),
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const { organizationId } = req.query;

    // Check cache first
    const cacheKey = `product:${id}`;
    const cachedProduct = await redis.cacheGet(cacheKey);
    if (cachedProduct) {
      return res.json(cachedProduct);
    }

    const product = await db('products')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .select(
        'products.*',
        'categories.name as category_name',
        'categories.color as category_color'
      )
      .where('products.id', id)
      .where('products.organization_id', organizationId)
      .first();

    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // Get product modifiers
    const modifiers = await db('product_modifier_groups')
      .leftJoin('product_modifiers', 'product_modifier_groups.modifier_id', 'product_modifiers.id')
      .leftJoin('modifier_options', 'product_modifiers.id', 'modifier_options.modifier_id')
      .select(
        'product_modifiers.id as modifier_id',
        'product_modifiers.name as modifier_name',
        'product_modifiers.type as modifier_type',
        'product_modifiers.is_required',
        'product_modifiers.min_selections',
        'product_modifiers.max_selections',
        'modifier_options.id as option_id',
        'modifier_options.name as option_name',
        'modifier_options.price_adjustment',
        'modifier_options.is_default',
        'modifier_options.sort_order as option_sort_order',
        'product_modifier_groups.sort_order as modifier_sort_order'
      )
      .where('product_modifier_groups.product_id', id)
      .where('product_modifiers.is_active', true)
      .where('modifier_options.is_active', true)
      .orderBy('product_modifier_groups.sort_order')
      .orderBy('modifier_options.sort_order');

    // Group modifiers and options
    const modifiersMap = new Map();
    modifiers.forEach(row => {
      if (!modifiersMap.has(row.modifier_id)) {
        modifiersMap.set(row.modifier_id, {
          id: row.modifier_id,
          name: row.modifier_name,
          type: row.modifier_type,
          isRequired: row.is_required,
          minSelections: row.min_selections,
          maxSelections: row.max_selections,
          sortOrder: row.modifier_sort_order,
          options: [],
        });
      }
      
      if (row.option_id) {
        modifiersMap.get(row.modifier_id).options.push({
          id: row.option_id,
          name: row.option_name,
          priceAdjustment: row.price_adjustment,
          isDefault: row.is_default,
          sortOrder: row.option_sort_order,
        });
      }
    });

    const result = {
      ...product,
      modifiers: Array.from(modifiersMap.values()),
    };

    // Cache for 10 minutes
    await redis.cacheSet(cacheKey, result, 600);

    res.json(result);
  })
);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 */
router.post('/',
  requirePermission('manage_products'),
  upload.single('image'),
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category_id').optional().isUUID().withMessage('Invalid category ID'),
    body('sku').optional().isString(),
    body('description').optional().isString(),
    body('type').optional().isIn(['food', 'beverage', 'combo', 'service']),
    body('prep_time').optional().isInt({ min: 0 }),
    body('calories').optional().isInt({ min: 0 }),
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { organizationId } = req.query;
    const productData = {
      ...req.body,
      organization_id: organizationId,
      price: parseFloat(req.body.price),
      prep_time: req.body.prep_time ? parseInt(req.body.prep_time) : 0,
      calories: req.body.calories ? parseInt(req.body.calories) : null,
      is_spicy: req.body.is_spicy === 'true',
      is_vegetarian: req.body.is_vegetarian === 'true',
      is_vegan: req.body.is_vegan === 'true',
      is_gluten_free: req.body.is_gluten_free === 'true',
      allergens: req.body.allergens ? JSON.parse(req.body.allergens) : [],
      ingredients: req.body.ingredients ? JSON.parse(req.body.ingredients) : [],
    };

    // Handle image upload
    if (req.file) {
      const filename = `product-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
      const imagePath = path.join('uploads', 'products', filename);
      
      // Process and save image
      await sharp(req.file.buffer)
        .resize(800, 600, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(imagePath);
        
      productData.image_url = `/uploads/products/${filename}`;
    }

    const [product] = await db('products').insert(productData).returning('*');

    // Clear products cache
    await redis.cacheDelete(`products:${organizationId}:*`);

    logger.info(`Product created: ${product.name}`, {
      productId: product.id,
      organizationId,
      userId: req.user?.id,
    });

    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  })
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */
router.put('/:id',
  requirePermission('manage_products'),
  upload.single('image'),
  [
    param('id').isUUID().withMessage('Invalid product ID'),
    body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const { organizationId } = req.query;

    // Check if product exists
    const existingProduct = await db('products')
      .where('id', id)
      .where('organization_id', organizationId)
      .first();

    if (!existingProduct) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    const updateData = { ...req.body };
    delete updateData.organizationId;

    // Handle numeric fields
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.prep_time) updateData.prep_time = parseInt(updateData.prep_time);
    if (updateData.calories) updateData.calories = parseInt(updateData.calories);

    // Handle boolean fields
    if ('is_spicy' in updateData) updateData.is_spicy = updateData.is_spicy === 'true';
    if ('is_vegetarian' in updateData) updateData.is_vegetarian = updateData.is_vegetarian === 'true';
    if ('is_vegan' in updateData) updateData.is_vegan = updateData.is_vegan === 'true';
    if ('is_gluten_free' in updateData) updateData.is_gluten_free = updateData.is_gluten_free === 'true';

    // Handle arrays
    if (updateData.allergens) updateData.allergens = JSON.parse(updateData.allergens);
    if (updateData.ingredients) updateData.ingredients = JSON.parse(updateData.ingredients);

    // Handle image upload
    if (req.file) {
      const filename = `product-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
      const imagePath = path.join('uploads', 'products', filename);
      
      // Process and save image
      await sharp(req.file.buffer)
        .resize(800, 600, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(imagePath);
        
      updateData.image_url = `/uploads/products/${filename}`;
      
      // TODO: Delete old image file
    }

    updateData.updated_at = new Date();

    const [updatedProduct] = await db('products')
      .where('id', id)
      .update(updateData)
      .returning('*');

    // Clear caches
    await redis.cacheDelete(`product:${id}`);
    await redis.cacheDelete(`products:${organizationId}:*`);

    logger.info(`Product updated: ${updatedProduct.name}`, {
      productId: id,
      organizationId,
      userId: req.user?.id,
    });

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  })
);

/**
 * @swagger
 * /products/{id}/status:
 *   patch:
 *     summary: Update product status
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [available, unavailable, 86ed]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch('/:id/status',
  requirePermission('manage_products'),
  [
    param('id').isUUID().withMessage('Invalid product ID'),
    body('status').isIn(['available', 'unavailable', '86ed']).withMessage('Invalid status'),
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const { status } = req.body;
    const { organizationId } = req.query;

    const [updatedProduct] = await db('products')
      .where('id', id)
      .where('organization_id', organizationId)
      .update({
        status,
        updated_at: new Date(),
      })
      .returning('*');

    if (!updatedProduct) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // Clear caches
    await redis.cacheDelete(`product:${id}`);
    await redis.cacheDelete(`products:${organizationId}:*`);

    // Broadcast status change via Socket.IO
    if (global.io) {
      global.io.to(`organization:${organizationId}`).emit('productStatusChanged', {
        productId: id,
        status,
        timestamp: new Date().toISOString(),
      });
    }

    logger.info(`Product status updated: ${updatedProduct.name} -> ${status}`, {
      productId: id,
      organizationId,
      userId: req.user?.id,
    });

    res.json({
      message: 'Product status updated successfully',
      product: updatedProduct,
    });
  })
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product (soft delete)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
router.delete('/:id',
  requireRole('admin', 'manager'),
  [
    param('id').isUUID().withMessage('Invalid product ID'),
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const { organizationId } = req.query;

    // Check if product has been ordered
    const hasOrders = await db('order_items')
      .leftJoin('orders', 'order_items.order_id', 'orders.id')
      .where('order_items.product_id', id)
      .where('orders.organization_id', organizationId)
      .first();

    if (hasOrders) {
      // Soft delete if product has orders
      const [updatedProduct] = await db('products')
        .where('id', id)
        .where('organization_id', organizationId)
        .update({
          is_active: false,
          updated_at: new Date(),
        })
        .returning('*');

      if (!updatedProduct) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      res.json({
        message: 'Product deactivated successfully (has order history)',
        product: updatedProduct,
      });
    } else {
      // Hard delete if no orders
      const deletedCount = await db('products')
        .where('id', id)
        .where('organization_id', organizationId)
        .del();

      if (deletedCount === 0) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      res.json({
        message: 'Product deleted successfully',
      });
    }

    // Clear caches
    await redis.cacheDelete(`product:${id}`);
    await redis.cacheDelete(`products:${organizationId}:*`);

    logger.info(`Product deleted/deactivated: ${id}`, {
      productId: id,
      organizationId,
      userId: req.user?.id,
    });
  })
);

export default router;