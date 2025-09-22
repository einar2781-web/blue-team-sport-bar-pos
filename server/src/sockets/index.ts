import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { logger } from '../config/logger';
import { JWTPayload } from '../middleware/auth';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    organizationId: string;
    email: string;
    role: string;
  };
}

export const initializeSocketIO = (io: SocketIOServer): void => {
  // Authentication middleware for Socket.IO
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      
      // Get user from database
      const user = await db('users')
        .select('id', 'organization_id', 'email', 'role', 'status', 'first_name', 'last_name')
        .where('id', decoded.userId)
        .where('status', 'active')
        .first();

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user info to socket
      socket.user = {
        id: user.id,
        organizationId: user.organization_id,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Handle connection
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('User connected via Socket.IO', {
      socketId: socket.id,
      userId: socket.user?.id,
      organizationId: socket.user?.organizationId,
    });

    // Join organization-specific room
    if (socket.user?.organizationId) {
      socket.join(`organization:${socket.user.organizationId}`);
      
      // Join role-specific rooms
      socket.join(`role:${socket.user.role}`);
      
      // Join user-specific room
      socket.join(`user:${socket.user.id}`);
    }

    // Handle kitchen display events
    socket.on('joinKitchen', () => {
      if (socket.user?.role === 'kitchen' && socket.user.organizationId) {
        socket.join(`kitchen:${socket.user.organizationId}`);
        logger.info('User joined kitchen display', {
          userId: socket.user.id,
          organizationId: socket.user.organizationId,
        });
      }
    });

    // Handle order status updates from kitchen
    socket.on('updateOrderItemStatus', async (data) => {
      try {
        if (socket.user?.role !== 'kitchen') {
          socket.emit('error', { message: 'Unauthorized to update order status' });
          return;
        }

        const { orderItemId, status } = data;

        // Update order item status in database
        const [updatedItem] = await db('order_items')
          .where('id', orderItemId)
          .update({
            status,
            updated_at: new Date(),
            ...(status === 'preparing' && { started_at: new Date() }),
            ...(status === 'ready' && { completed_at: new Date() }),
          })
          .returning('*');

        if (updatedItem) {
          // Get order details
          const order = await db('orders')
            .select('id', 'order_number', 'table_id', 'waiter_id')
            .where('id', updatedItem.order_id)
            .first();

          // Broadcast to organization
          io.to(`organization:${socket.user.organizationId}`).emit('orderItemStatusChanged', {
            orderItemId,
            orderId: order?.id,
            orderNumber: order?.order_number,
            tableId: order?.table_id,
            status,
            timestamp: new Date().toISOString(),
          });

          // Check if all items are ready to update order status
          const allItems = await db('order_items')
            .where('order_id', updatedItem.order_id)
            .select('status');

          const allReady = allItems.every(item => item.status === 'ready');
          if (allReady && status === 'ready') {
            await db('orders')
              .where('id', updatedItem.order_id)
              .update({
                status: 'ready',
                ready_at: new Date(),
              });

            io.to(`organization:${socket.user.organizationId}`).emit('orderStatusChanged', {
              orderId: updatedItem.order_id,
              status: 'ready',
              timestamp: new Date().toISOString(),
            });
          }

          logger.info('Order item status updated', {
            orderItemId,
            status,
            userId: socket.user.id,
          });
        }
      } catch (error) {
        logger.error('Error updating order item status:', error);
        socket.emit('error', { message: 'Failed to update order status' });
      }
    });

    // Handle table status updates
    socket.on('updateTableStatus', async (data) => {
      try {
        const { tableId, status } = data;

        // Check permission
        if (!['waiter', 'manager', 'admin'].includes(socket.user?.role || '')) {
          socket.emit('error', { message: 'Unauthorized to update table status' });
          return;
        }

        // Update table status
        const [updatedTable] = await db('tables')
          .where('id', tableId)
          .where('organization_id', socket.user?.organizationId)
          .update({
            status,
            updated_at: new Date(),
          })
          .returning('*');

        if (updatedTable) {
          // Broadcast to organization
          io.to(`organization:${socket.user.organizationId}`).emit('tableStatusChanged', {
            tableId,
            status,
            tableNumber: updatedTable.number,
            timestamp: new Date().toISOString(),
          });

          logger.info('Table status updated via Socket.IO', {
            tableId,
            status,
            userId: socket.user.id,
          });
        }
      } catch (error) {
        logger.error('Error updating table status:', error);
        socket.emit('error', { message: 'Failed to update table status' });
      }
    });

    // Handle product availability updates
    socket.on('updateProductAvailability', async (data) => {
      try {
        const { productId, status } = data;

        // Check permission
        if (!['manager', 'admin'].includes(socket.user?.role || '')) {
          socket.emit('error', { message: 'Unauthorized to update product availability' });
          return;
        }

        // Update product status
        const [updatedProduct] = await db('products')
          .where('id', productId)
          .where('organization_id', socket.user?.organizationId)
          .update({
            status,
            updated_at: new Date(),
          })
          .returning('*');

        if (updatedProduct) {
          // Broadcast to organization
          io.to(`organization:${socket.user.organizationId}`).emit('productStatusChanged', {
            productId,
            status,
            productName: updatedProduct.name,
            timestamp: new Date().toISOString(),
          });

          logger.info('Product availability updated via Socket.IO', {
            productId,
            status,
            userId: socket.user.id,
          });
        }
      } catch (error) {
        logger.error('Error updating product availability:', error);
        socket.emit('error', { message: 'Failed to update product availability' });
      }
    });

    // Handle call waiter requests
    socket.on('callWaiter', async (data) => {
      try {
        const { tableId, message } = data;

        // Get table details
        const table = await db('tables')
          .select('number', 'name', 'organization_id')
          .where('id', tableId)
          .first();

        if (table && table.organization_id === socket.user?.organizationId) {
          // Broadcast to all waiters
          io.to(`role:waiter`).to(`organization:${socket.user.organizationId}`).emit('waiterCalled', {
            tableId,
            tableNumber: table.number,
            tableName: table.name,
            message: message || 'Assistance needed',
            timestamp: new Date().toISOString(),
          });

          // Also broadcast to managers
          io.to(`role:manager`).to(`organization:${socket.user.organizationId}`).emit('waiterCalled', {
            tableId,
            tableNumber: table.number,
            tableName: table.name,
            message: message || 'Assistance needed',
            timestamp: new Date().toISOString(),
          });

          logger.info('Waiter called', {
            tableId,
            message,
            userId: socket.user?.id,
          });
        }
      } catch (error) {
        logger.error('Error calling waiter:', error);
        socket.emit('error', { message: 'Failed to call waiter' });
      }
    });

    // Handle user typing in chat (if implementing chat feature)
    socket.on('typing', (data) => {
      socket.to(`organization:${socket.user?.organizationId}`).emit('userTyping', {
        userId: socket.user?.id,
        ...data,
      });
    });

    socket.on('stopTyping', (data) => {
      socket.to(`organization:${socket.user?.organizationId}`).emit('userStoppedTyping', {
        userId: socket.user?.id,
        ...data,
      });
    });

    // Handle low inventory alerts
    socket.on('inventoryAlert', (data) => {
      if (['manager', 'admin'].includes(socket.user?.role || '')) {
        io.to(`role:manager`).to(`organization:${socket.user.organizationId}`).emit('inventoryAlert', {
          ...data,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info('User disconnected from Socket.IO', {
        socketId: socket.id,
        userId: socket.user?.id,
        organizationId: socket.user?.organizationId,
        reason,
      });
    });

    // Handle connection errors
    socket.on('error', (error) => {
      logger.error('Socket.IO error:', {
        socketId: socket.id,
        userId: socket.user?.id,
        error: error.message,
      });
    });
  });

  // Handle server-level Socket.IO errors
  io.on('error', (error) => {
    logger.error('Socket.IO server error:', error);
  });

  logger.info('Socket.IO initialized successfully');
};

// Helper function to emit events to specific organization
export const emitToOrganization = (organizationId: string, event: string, data: any): void => {
  if (global.io) {
    global.io.to(`organization:${organizationId}`).emit(event, data);
  }
};

// Helper function to emit events to specific role
export const emitToRole = (organizationId: string, role: string, event: string, data: any): void => {
  if (global.io) {
    global.io.to(`role:${role}`).to(`organization:${organizationId}`).emit(event, data);
  }
};

// Helper function to emit events to specific user
export const emitToUser = (userId: string, event: string, data: any): void => {
  if (global.io) {
    global.io.to(`user:${userId}`).emit(event, data);
  }
};

export default initializeSocketIO;