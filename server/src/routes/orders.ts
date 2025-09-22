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
 * /orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, confirmed, preparing, ready, served, paid, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: table_id
 *         schema:
 *           type: string
 *         description: Filter by table ID
 *       - in: query
 *         name: waiter_id
 *         schema:
 *           type: string
 *         description: Filter by waiter ID
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders from date
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders to date
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/',
  requirePermission('view_orders'),
  [
    query('status').optional().isIn(['draft', 'pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'cancelled']),
    query('table_id').optional().isUUID(),
    query('waiter_id').optional().isUUID(),
    query('from_date').optional().isISO8601(),
    query('to_date').optional().isISO8601(),
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const {
      status,
      table_id,
      waiter_id,
      from_date,
      to_date,
      organizationId,
    } = req.query as any;

    let query = db('orders')
      .leftJoin('tables', 'orders.table_id', 'tables.id')
      .leftJoin('users', 'orders.waiter_id', 'users.id')
      .leftJoin('customers', 'orders.customer_id', 'customers.id')
      .select(
        'orders.id',
        'orders.order_number',
        'orders.type',
        'orders.status',
        'orders.guest_count',
        'orders.subtotal',
        'orders.tax_amount',
        'orders.service_charge',
        'orders.discount_amount',
        'orders.total_amount',
        'orders.notes',
        'orders.estimated_ready_time',
        'orders.created_at',
        'orders.updated_at',
        'tables.number as table_number',
        'tables.name as table_name',
        'users.first_name as waiter_first_name',
        'users.last_name as waiter_last_name',
        'customers.first_name as customer_first_name',
        'customers.last_name as customer_last_name'
      )
      .where('orders.organization_id', organizationId)
      .orderBy('orders.created_at', 'desc');

    // Apply filters
    if (status) {
      query = query.where('orders.status', status);
    }

    if (table_id) {
      query = query.where('orders.table_id', table_id);
    }

    if (waiter_id) {
      query = query.where('orders.waiter_id', waiter_id);
    }

    if (from_date) {
      query = query.where('orders.created_at', '>=', from_date);
    }

    if (to_date) {
      query = query.where('orders.created_at', '<=', to_date);
    }

    const orders = await query;

    // Get order items count for each order
    const orderIds = orders.map(order => order.id);
    if (orderIds.length > 0) {
      const itemCounts = await db('order_items')
        .whereIn('order_id', orderIds)
        .groupBy('order_id')
        .select('order_id')
        .count('* as item_count');

      const itemCountMap = new Map();
      itemCounts.forEach(item => {
        itemCountMap.set(item.order_id, parseInt(item.item_count as string));
      });

      orders.forEach(order => {
        order.item_count = itemCountMap.get(order.id) || 0;
      });
    }

    res.json({
      orders,
      count: orders.length,
    });
  })
);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get a specific order with items
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details with items
 *       404:
 *         description: Order not found
 */
router.get('/:id',
  requirePermission('view_orders'),
  [
    param('id').isUUID().withMessage('Invalid order ID'),
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const { organizationId } = req.query;

    // Get order details
    const order = await db('orders')
      .leftJoin('tables', 'orders.table_id', 'tables.id')
      .leftJoin('users', 'orders.waiter_id', 'users.id')
      .leftJoin('customers', 'orders.customer_id', 'customers.id')
      .select(
        'orders.*',
        'tables.number as table_number',
        'tables.name as table_name',
        'users.first_name as waiter_first_name',
        'users.last_name as waiter_last_name',
        'customers.first_name as customer_first_name',
        'customers.last_name as customer_last_name',
        'customers.phone as customer_phone',
        'customers.email as customer_email'
      )
      .where('orders.id', id)
      .where('orders.organization_id', organizationId)
      .first();

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    // Get order items with product details
    const items = await db('order_items')
      .leftJoin('products', 'order_items.product_id', 'products.id')
      .select(
        'order_items.id',
        'order_items.quantity',
        'order_items.unit_price',
        'order_items.total_price',
        'order_items.status',
        'order_items.notes',
        'order_items.kitchen_notes',
        'order_items.started_at',
        'order_items.completed_at',
        'order_items.created_at',
        'products.name as product_name',
        'products.sku as product_sku',
        'products.type as product_type',
        'products.prep_time',
        'products.image_url as product_image'
      )
      .where('order_items.order_id', id)
      .orderBy('order_items.created_at');

    // Get modifiers for each order item
    const itemIds = items.map(item => item.id);
    let modifiers = [];
    
    if (itemIds.length > 0) {
      modifiers = await db('order_item_modifiers')
        .leftJoin('modifier_options', 'order_item_modifiers.modifier_option_id', 'modifier_options.id')
        .leftJoin('product_modifiers', 'modifier_options.modifier_id', 'product_modifiers.id')
        .select(
          'order_item_modifiers.order_item_id',
          'order_item_modifiers.quantity',
          'order_item_modifiers.unit_price',
          'order_item_modifiers.total_price',
          'modifier_options.name as option_name',
          'product_modifiers.name as modifier_name'
        )
        .whereIn('order_item_modifiers.order_item_id', itemIds);
    }

    // Group modifiers by order item
    const modifiersMap = new Map();
    modifiers.forEach(modifier => {
      if (!modifiersMap.has(modifier.order_item_id)) {
        modifiersMap.set(modifier.order_item_id, []);
      }
      modifiersMap.get(modifier.order_item_id).push({
        name: `${modifier.modifier_name}: ${modifier.option_name}`,
        quantity: modifier.quantity,
        unitPrice: modifier.unit_price,
        totalPrice: modifier.total_price,
      });
    });

    // Attach modifiers to items
    items.forEach(item => {
      item.modifiers = modifiersMap.get(item.id) || [];
    });

    // Get payment information
    const payments = await db('payments')
      .leftJoin('users as cashiers', 'payments.cashier_id', 'cashiers.id')
      .select(
        'payments.id',
        'payments.method',
        'payments.status',
        'payments.amount',
        'payments.tip_amount',
        'payments.change_amount',
        'payments.reference_number',
        'payments.processed_at',
        'cashiers.first_name as cashier_first_name',
        'cashiers.last_name as cashier_last_name'
      )
      .where('payments.order_id', id)
      .orderBy('payments.created_at');

    res.json({
      order,
      items,
      payments,
    });
  })
);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               table_id:
 *                 type: string
 *                 format: uuid
 *               customer_id:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [dine_in, takeout, delivery, drive_thru]
 *               guest_count:
 *                 type: integer
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post('/',
  requirePermission('create_orders'),
  [
    body('table_id').optional().isUUID().withMessage('Invalid table ID'),
    body('customer_id').optional().isUUID().withMessage('Invalid customer ID'),
    body('type').optional().isIn(['dine_in', 'takeout', 'delivery', 'drive_thru']),
    body('guest_count').optional().isInt({ min: 1 }),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.product_id').isUUID().withMessage('Invalid product ID'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { organizationId } = req.query;
    const { table_id, customer_id, type = 'dine_in', guest_count = 1, notes, items } = req.body;

    // Start transaction
    const trx = await db.transaction();

    try {
      // Generate order number
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const orderCount = await trx('orders')
        .where('organization_id', organizationId)
        .where('created_at', '>=', new Date().toISOString().slice(0, 10))
        .count('* as count')
        .first();
      
      const orderNumber = `ORD-${today}-${String(parseInt(orderCount?.count as string || '0') + 1).padStart(4, '0')}`;

      // Validate products and calculate prices
      const productIds = items.map((item: any) => item.product_id);
      const products = await trx('products')
        .whereIn('id', productIds)
        .where('organization_id', organizationId)
        .where('is_active', true)
        .where('status', 'available');

      if (products.length !== productIds.length) {
        throw new AppError('One or more products are not available', 400, 'PRODUCT_UNAVAILABLE');
      }

      const productMap = new Map();
      products.forEach(product => {
        productMap.set(product.id, product);
      });

      // Calculate order totals
      let subtotal = 0;
      const processedItems = [];

      for (const item of items) {
        const product = productMap.get(item.product_id);
        const itemSubtotal = product.price * item.quantity;
        
        processedItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: product.price,
          total_price: itemSubtotal,
          notes: item.notes || null,
          modifiers: item.modifiers || [],
        });

        subtotal += itemSubtotal;

        // Add modifier prices
        if (item.modifiers && item.modifiers.length > 0) {
          const modifierIds = item.modifiers.map((mod: any) => mod.option_id);
          const modifierOptions = await trx('modifier_options')
            .whereIn('id', modifierIds);

          const modifierMap = new Map();
          modifierOptions.forEach(opt => {
            modifierMap.set(opt.id, opt);
          });

          for (const modifier of item.modifiers) {
            const option = modifierMap.get(modifier.option_id);
            if (option) {
              const modifierPrice = option.price_adjustment * (modifier.quantity || 1) * item.quantity;
              subtotal += modifierPrice;
              processedItems[processedItems.length - 1].total_price += modifierPrice;
            }
          }
        }
      }

      // Get organization tax rate
      const organization = await trx('organizations')
        .select('tax_rate', 'service_charge')
        .where('id', organizationId)
        .first();

      const taxAmount = subtotal * (organization?.tax_rate || 0);
      const serviceCharge = subtotal * (organization?.service_charge || 0);
      const totalAmount = subtotal + taxAmount + serviceCharge;

      // Create order
      const [order] = await trx('orders').insert({
        organization_id: organizationId,
        order_number: orderNumber,
        table_id: table_id || null,
        waiter_id: req.user?.id,
        customer_id: customer_id || null,
        type,
        status: 'pending',
        guest_count,
        subtotal,
        tax_amount: taxAmount,
        service_charge: serviceCharge,
        total_amount: totalAmount,
        notes: notes || null,
        estimated_ready_time: new Date(Date.now() + calculateEstimatedTime(processedItems, productMap) * 60000), // Convert minutes to ms
      }).returning('*');

      // Create order items
      const orderItems = [];
      for (const item of processedItems) {
        const [orderItem] = await trx('order_items').insert({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          notes: item.notes,
        }).returning('*');

        orderItems.push(orderItem);

        // Create order item modifiers
        if (item.modifiers && item.modifiers.length > 0) {
          for (const modifier of item.modifiers) {
            const option = await trx('modifier_options')
              .where('id', modifier.option_id)
              .first();

            if (option) {
              await trx('order_item_modifiers').insert({
                order_item_id: orderItem.id,
                modifier_option_id: modifier.option_id,
                quantity: modifier.quantity || 1,
                unit_price: option.price_adjustment,
                total_price: option.price_adjustment * (modifier.quantity || 1),
              });
            }
          }
        }
      }

      // Update table status if applicable
      if (table_id) {
        await trx('tables')
          .where('id', table_id)
          .update({ status: 'occupied' });
      }

      // Commit transaction
      await trx.commit();

      // Broadcast new order to kitchen via Socket.IO
      if (global.io) {
        global.io.to(`organization:${organizationId}`).emit('newOrder', {
          order: {
            ...order,
            items: orderItems,
          },
          timestamp: new Date().toISOString(),
        });
      }

      logger.info(`Order created: ${order.order_number}`, {
        orderId: order.id,
        organizationId,
        userId: req.user?.id,
        totalAmount,
        itemCount: items.length,
      });

      res.status(201).json({
        message: 'Order created successfully',
        order: {
          ...order,
          items: orderItems,
        },
      });

    } catch (error) {
      await trx.rollback();
      throw error;
    }
  })
);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
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
 *                 enum: [confirmed, preparing, ready, served, cancelled]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch('/:id/status',
  requirePermission('update_order_status'),
  [
    param('id').isUUID().withMessage('Invalid order ID'),
    body('status').isIn(['confirmed', 'preparing', 'ready', 'served', 'cancelled']).withMessage('Invalid status'),
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const { status } = req.body;
    const { organizationId } = req.query;

    const updateData: any = {
      status,
      updated_at: new Date(),
    };

    // Add timestamps for specific status changes
    if (status === 'confirmed') {
      updateData.confirmed_at = new Date();
    } else if (status === 'ready') {
      updateData.ready_at = new Date();
    } else if (status === 'served') {
      updateData.served_at = new Date();
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date();
    }

    const [updatedOrder] = await db('orders')
      .where('id', id)
      .where('organization_id', organizationId)
      .update(updateData)
      .returning('*');

    if (!updatedOrder) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    // Update table status if order is completed
    if (['served', 'cancelled'].includes(status) && updatedOrder.table_id) {
      // Check if there are any other active orders for this table
      const activeOrders = await db('orders')
        .where('table_id', updatedOrder.table_id)
        .where('status', 'not in', ['served', 'paid', 'cancelled'])
        .where('id', '!=', id);

      if (activeOrders.length === 0) {
        await db('tables')
          .where('id', updatedOrder.table_id)
          .update({ status: 'available' });
      }
    }

    // Broadcast status change via Socket.IO
    if (global.io) {
      global.io.to(`organization:${organizationId}`).emit('orderStatusChanged', {
        orderId: id,
        status,
        timestamp: new Date().toISOString(),
      });
    }

    logger.info(`Order status updated: ${updatedOrder.order_number} -> ${status}`, {
      orderId: id,
      organizationId,
      userId: req.user?.id,
    });

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder,
    });
  })
);

// Helper function to calculate estimated preparation time
function calculateEstimatedTime(items: any[], productMap: Map<string, any>): number {
  let maxTime = 0;
  
  for (const item of items) {
    const product = productMap.get(item.product_id);
    if (product && product.prep_time) {
      maxTime = Math.max(maxTime, product.prep_time);
    }
  }
  
  return maxTime || 15; // Default 15 minutes if no prep time specified
}

export default router;