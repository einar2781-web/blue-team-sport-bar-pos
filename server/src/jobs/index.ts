import cron from 'node-cron';
import { db } from '../config/database';
import redis from '../config/redis';
import { logger } from '../config/logger';

// Clean up expired sessions every hour
cron.schedule('0 * * * *', async () => {
  logger.info('Running expired sessions cleanup job');
  
  try {
    // Clean up expired password reset tokens
    await db('users')
      .where('reset_password_expires_at', '<', new Date())
      .whereNotNull('reset_password_token')
      .update({
        reset_password_token: null,
        reset_password_expires_at: null,
      });
    
    logger.info('Expired sessions cleanup completed');
  } catch (error) {
    logger.error('Error in expired sessions cleanup:', error);
  }
});

// Clean up old audit logs (keep last 90 days) - runs daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  logger.info('Running audit logs cleanup job');
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    const deletedCount = await db('audit_logs')
      .where('created_at', '<', cutoffDate)
      .del();
    
    logger.info(`Cleaned up ${deletedCount} old audit logs`);
  } catch (error) {
    logger.error('Error in audit logs cleanup:', error);
  }
});

// Update inventory alerts - runs every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  logger.info('Checking inventory levels for alerts');
  
  try {
    // Find items below reorder point
    const lowStockItems = await db('inventory_items')
      .leftJoin('organizations', 'inventory_items.organization_id', 'organizations.id')
      .select(
        'inventory_items.*',
        'organizations.name as organization_name'
      )
      .whereRaw('current_stock <= reorder_point')
      .where('inventory_items.is_active', true)
      .where('organizations.is_active', true);

    // Send alerts via Socket.IO if items found
    if (lowStockItems.length > 0 && global.io) {
      for (const item of lowStockItems) {
        global.io.to(`organization:${item.organization_id}`).emit('inventoryAlert', {
          type: 'low_stock',
          itemId: item.id,
          itemName: item.name,
          currentStock: item.current_stock,
          reorderPoint: item.reorder_point,
          unit: item.unit,
          timestamp: new Date().toISOString(),
        });
      }
      
      logger.info(`Sent inventory alerts for ${lowStockItems.length} items`);
    }
  } catch (error) {
    logger.error('Error checking inventory levels:', error);
  }
});

// Clean up expired blacklisted tokens - runs every 6 hours
cron.schedule('0 */6 * * *', async () => {
  logger.info('Cleaning up expired blacklisted tokens');
  
  try {
    const keys = await redis.getClient().keys('blacklist:*');
    let cleanedCount = 0;
    
    for (const key of keys) {
      const ttl = await redis.getClient().ttl(key);
      if (ttl === -1) { // No expiration set
        await redis.del(key);
        cleanedCount++;
      }
    }
    
    logger.info(`Cleaned up ${cleanedCount} expired tokens`);
  } catch (error) {
    logger.error('Error cleaning up blacklisted tokens:', error);
  }
});

// Check for orders that should be ready - runs every minute
cron.schedule('* * * * *', async () => {
  try {
    // Find orders that should be ready based on estimated time
    const overdueOrders = await db('orders')
      .select('id', 'order_number', 'organization_id', 'table_id', 'estimated_ready_time')
      .where('status', 'preparing')
      .where('estimated_ready_time', '<', new Date())
      .whereNotNull('estimated_ready_time');

    // Send notifications for overdue orders
    if (overdueOrders.length > 0 && global.io) {
      for (const order of overdueOrders) {
        global.io.to(`organization:${order.organization_id}`).emit('orderOverdue', {
          orderId: order.id,
          orderNumber: order.order_number,
          tableId: order.table_id,
          estimatedReadyTime: order.estimated_ready_time,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    logger.error('Error checking overdue orders:', error);
  }
});

// Generate daily sales summary - runs at midnight
cron.schedule('0 0 * * *', async () => {
  logger.info('Generating daily sales summary');
  
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const endOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);

    // Get organizations to generate reports for
    const organizations = await db('organizations')
      .select('id', 'name')
      .where('is_active', true);

    for (const org of organizations) {
      // Calculate daily metrics
      const salesData = await db('orders')
        .where('organization_id', org.id)
        .where('status', 'paid')
        .whereBetween('created_at', [startOfDay, endOfDay])
        .select(
          db.raw('COUNT(*) as order_count'),
          db.raw('SUM(total_amount) as total_revenue'),
          db.raw('AVG(total_amount) as average_order_value'),
          db.raw('SUM(guest_count) as total_guests')
        )
        .first();

      // Store in cache for dashboard
      await redis.cacheSet(
        `daily_summary:${org.id}:${yesterday.toISOString().split('T')[0]}`,
        salesData,
        7 * 24 * 3600 // Keep for 7 days
      );

      logger.info(`Generated daily summary for ${org.name}`, {
        organizationId: org.id,
        date: yesterday.toISOString().split('T')[0],
        orderCount: salesData?.order_count || 0,
        revenue: salesData?.total_revenue || 0,
      });
    }
  } catch (error) {
    logger.error('Error generating daily sales summary:', error);
  }
});

logger.info('Scheduled jobs initialized');

export default cron;