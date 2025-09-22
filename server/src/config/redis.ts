import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

class RedisClient {
  private client: RedisClientType | null = null;
  private subscriber: RedisClientType | null = null;
  private publisher: RedisClientType | null = null;

  async connect(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      // Main client for general operations
      this.client = createClient({ url: redisUrl });
      this.client.on('error', (err) => logger.error('Redis Client Error:', err));
      await this.client.connect();

      // Subscriber client for pub/sub
      this.subscriber = createClient({ url: redisUrl });
      this.subscriber.on('error', (err) => logger.error('Redis Subscriber Error:', err));
      await this.subscriber.connect();

      // Publisher client for pub/sub
      this.publisher = createClient({ url: redisUrl });
      this.publisher.on('error', (err) => logger.error('Redis Publisher Error:', err));
      await this.publisher.connect();

      logger.info('Redis connected successfully');
    } catch (error) {
      logger.error('Redis connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
        this.client = null;
      }
      if (this.subscriber) {
        await this.subscriber.quit();
        this.subscriber = null;
      }
      if (this.publisher) {
        await this.publisher.quit();
        this.publisher = null;
      }
      logger.info('Redis disconnected');
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  getClient(): RedisClientType {
    if (!this.client) {
      throw new Error('Redis client not connected');
    }
    return this.client;
  }

  getSubscriber(): RedisClientType {
    if (!this.subscriber) {
      throw new Error('Redis subscriber not connected');
    }
    return this.subscriber;
  }

  getPublisher(): RedisClientType {
    if (!this.publisher) {
      throw new Error('Redis publisher not connected');
    }
    return this.publisher;
  }

  // Cache operations
  async get(key: string): Promise<string | null> {
    return await this.getClient().get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<string | null> {
    if (ttl) {
      return await this.getClient().setEx(key, ttl, value);
    }
    return await this.getClient().set(key, value);
  }

  async del(key: string): Promise<number> {
    return await this.getClient().del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.getClient().exists(key);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    return await this.getClient().expire(key, seconds);
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | undefined> {
    return await this.getClient().hGet(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return await this.getClient().hSet(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.getClient().hGetAll(key);
  }

  async hdel(key: string, field: string): Promise<number> {
    return await this.getClient().hDel(key, field);
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    return await this.getClient().lPush(key, values);
  }

  async rpop(key: string): Promise<string | null> {
    return await this.getClient().rPop(key);
  }

  async llen(key: string): Promise<number> {
    return await this.getClient().lLen(key);
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    return await this.getClient().sAdd(key, members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return await this.getClient().sRem(key, members);
  }

  async smembers(key: string): Promise<string[]> {
    return await this.getClient().sMembers(key);
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<number> {
    return await this.getPublisher().publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.getSubscriber().subscribe(channel, callback);
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.getSubscriber().unsubscribe(channel);
  }

  // Session operations
  async setSession(sessionId: string, data: any, ttl: number = 3600): Promise<void> {
    await this.set(`session:${sessionId}`, JSON.stringify(data), ttl);
  }

  async getSession(sessionId: string): Promise<any> {
    const data = await this.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  // Cache helper methods
  async cacheGet<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async cacheSet<T>(key: string, data: T, ttl: number = 3600): Promise<void> {
    await this.set(key, JSON.stringify(data), ttl);
  }

  async cacheDelete(key: string): Promise<void> {
    await this.del(key);
  }
}

export const redis = new RedisClient();

export const connectRedis = async (): Promise<void> => {
  await redis.connect();
};

export const disconnectRedis = async (): Promise<void> => {
  await redis.disconnect();
};

export default redis;