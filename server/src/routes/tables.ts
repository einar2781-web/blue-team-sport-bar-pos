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
 * /tables:
 *   get:
 *     summary: Get all tables
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tables with their current status
 */
router.get('/',
  requirePermission('manage_tables'),
  catchAsync(async (req, res) => {
    const { organizationId } = req.query;

    const tables = await db('tables')
      .leftJoin('sections', 'tables.section_id', 'sections.id')
      .select(
        'tables.*',
        'sections.name as section_name',
        'sections.color as section_color'
      )
      .where('tables.organization_id', organizationId)
      .where('tables.is_active', true)
      .orderBy('sections.name')
      .orderBy('tables.number');

    // Get current orders for occupied tables
    const occupiedTables = tables.filter(table => table.status === 'occupied').map(table => table.id);
    let currentOrders = [];
    
    if (occupiedTables.length > 0) {
      currentOrders = await db('orders')
        .leftJoin('users', 'orders.waiter_id', 'users.id')
        .select(
          'orders.id',
          'orders.order_number',
          'orders.table_id',
          'orders.status',
          'orders.total_amount',
          'orders.created_at',
          'users.first_name as waiter_first_name',
          'users.last_name as waiter_last_name'
        )
        .whereIn('orders.table_id', occupiedTables)
        .where('orders.status', 'not in', ['served', 'paid', 'cancelled']);
    }

    // Map current orders to tables
    const orderMap = new Map();
    currentOrders.forEach(order => {
      if (!orderMap.has(order.table_id)) {
        orderMap.set(order.table_id, []);
      }
      orderMap.get(order.table_id).push(order);
    });

    tables.forEach(table => {
      table.current_orders = orderMap.get(table.id) || [];
    });

    res.json({ tables });
  })
);

/**
 * @swagger
 * /tables/{id}/status:
 *   patch:
 *     summary: Update table status
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Table ID
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
 *                 enum: [available, occupied, reserved, cleaning, out_of_order]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch('/:id/status',
  requirePermission('manage_tables'),
  [
    param('id').isUUID().withMessage('Invalid table ID'),
    body('status').isIn(['available', 'occupied', 'reserved', 'cleaning', 'out_of_order']).withMessage('Invalid status'),
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const { status } = req.body;
    const { organizationId } = req.query;

    const [updatedTable] = await db('tables')
      .where('id', id)
      .where('organization_id', organizationId)
      .update({
        status,
        updated_at: new Date(),
      })
      .returning('*');

    if (!updatedTable) {
      throw new AppError('Table not found', 404, 'TABLE_NOT_FOUND');
    }

    // Broadcast status change via Socket.IO
    if (global.io) {
      global.io.to(`organization:${organizationId}`).emit('tableStatusChanged', {
        tableId: id,
        status,
        timestamp: new Date().toISOString(),
      });
    }

    logger.info(`Table status updated: Table ${updatedTable.number} -> ${status}`, {
      tableId: id,
      organizationId,
      userId: req.user?.id,
    });

    res.json({
      message: 'Table status updated successfully',
      table: updatedTable,
    });
  })
);

export default router;