import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

// Import configurations and middleware
import { logger } from './config/logger';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { rateLimitConfig } from './config/rateLimit';

// Import route handlers
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import organizationRoutes from './routes/organizations';
import categoryRoutes from './routes/categories';
import productRoutes from './routes/products';
import tableRoutes from './routes/tables';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import customerRoutes from './routes/customers';
import inventoryRoutes from './routes/inventory';
import reportRoutes from './routes/reports';
import settingRoutes from './routes/settings';
import notificationRoutes from './routes/notifications';

// Import Socket.IO handlers
import { initializeSocketIO } from './sockets';

// Import scheduled jobs
import './jobs';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize Socket.IO handlers
initializeSocketIO(io);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Rate limiting
app.use(rateLimit(rateLimitConfig));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// Public routes (no authentication required)
app.use(`${apiPrefix}/auth`, authRoutes);

// Protected routes (authentication required)
app.use(`${apiPrefix}/users`, authMiddleware, userRoutes);
app.use(`${apiPrefix}/organizations`, authMiddleware, organizationRoutes);
app.use(`${apiPrefix}/categories`, authMiddleware, categoryRoutes);
app.use(`${apiPrefix}/products`, authMiddleware, productRoutes);
app.use(`${apiPrefix}/tables`, authMiddleware, tableRoutes);
app.use(`${apiPrefix}/orders`, authMiddleware, orderRoutes);
app.use(`${apiPrefix}/payments`, authMiddleware, paymentRoutes);
app.use(`${apiPrefix}/customers`, authMiddleware, customerRoutes);
app.use(`${apiPrefix}/inventory`, authMiddleware, inventoryRoutes);
app.use(`${apiPrefix}/reports`, authMiddleware, reportRoutes);
app.use(`${apiPrefix}/settings`, authMiddleware, settingRoutes);
app.use(`${apiPrefix}/notifications`, authMiddleware, notificationRoutes);

// API documentation
if (process.env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('./config/swagger');
  
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  logger.info('API documentation available at /api-docs');
}

// Catch-all for undefined routes
app.all('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(() => {
    process.exit(1);
  });
});

// Uncaught exception
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  server.close(() => {
    process.exit(1);
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Start HTTP server
    const port = process.env.PORT || 3001;
    server.listen(port, () => {
      logger.info(`Server running on port ${port}`, {
        port,
        environment: process.env.NODE_ENV,
        apiPrefix,
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Make io available globally
declare global {
  var io: SocketIOServer;
}
global.io = io;

// Start the server
startServer();

export default app;