import knex, { Knex } from 'knex';
import { logger } from './logger';

const config: Knex.Config = {
  client: 'postgresql',
  connection: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'restaurant_pos',
    user: process.env.DATABASE_USER || 'restaurant_user',
    password: process.env.DATABASE_PASSWORD || 'restaurant_password',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: 2,
    max: 20,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  },
  acquireConnectionTimeout: 30000,
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './seeds',
  },
  debug: process.env.NODE_ENV === 'development',
};

export const db = knex(config);

export const connectDatabase = async (): Promise<void> => {
  try {
    // Test the connection
    await db.raw('SELECT 1');
    logger.info('Database connection established successfully');

    // Run pending migrations in production
    if (process.env.NODE_ENV === 'production') {
      const pendingMigrations = await db.migrate.list();
      if (pendingMigrations[1].length > 0) {
        logger.info(`Running ${pendingMigrations[1].length} pending migrations`);
        await db.migrate.latest();
        logger.info('Database migrations completed successfully');
      }
    }
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    await db.destroy();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};

export default db;