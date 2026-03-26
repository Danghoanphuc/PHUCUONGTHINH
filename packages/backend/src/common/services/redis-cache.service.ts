import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Redis-based cache service for production
 * Falls back to in-memory cache if Redis is not available
 */
@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private redis: any = null;
  private fallbackCache = new Map<
    string,
    { value: any; expiresAt: number | null }
  >();
  private useRedis = false;

  constructor(private configService: ConfigService) {
    this.initializeRedis();
  }

  private async initializeRedis() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      console.log('⚠️  Redis URL not configured, using in-memory cache');
      return;
    }

    try {
      // Dynamic import to avoid bundling issues
      const { default: Redis } = await import('ioredis');
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            console.error('❌ Redis connection failed, falling back to memory');
            this.useRedis = false;
            return null;
          }
          return Math.min(times * 100, 2000);
        },
      });

      this.redis.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.useRedis = true;
      });

      this.redis.on('error', (err: Error) => {
        console.error('❌ Redis error:', err.message);
        this.useRedis = false;
      });
    } catch (error) {
      console.error('❌ Failed to initialize Redis:', error);
      this.useRedis = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.useRedis && this.redis) {
      try {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.error('Redis get error:', error);
        // Fall back to memory cache
      }
    }

    // Fallback to in-memory
    const entry = this.fallbackCache.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.fallbackCache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (this.useRedis && this.redis) {
      try {
        const serialized = JSON.stringify(value);
        if (ttl) {
          await this.redis.setex(key, ttl, serialized);
        } else {
          await this.redis.set(key, serialized);
        }
        return;
      } catch (error) {
        console.error('Redis set error:', error);
        // Fall through to memory cache
      }
    }

    // Fallback to in-memory
    const expiresAt = ttl ? Date.now() + ttl * 1000 : null;
    this.fallbackCache.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<boolean> {
    if (this.useRedis && this.redis) {
      try {
        await this.redis.del(key);
        return true;
      } catch (error) {
        console.error('Redis delete error:', error);
      }
    }

    return this.fallbackCache.delete(key);
  }

  async clear(): Promise<void> {
    if (this.useRedis && this.redis) {
      try {
        await this.redis.flushdb();
      } catch (error) {
        console.error('Redis clear error:', error);
      }
    }

    this.fallbackCache.clear();
  }

  async has(key: string): Promise<boolean> {
    if (this.useRedis && this.redis) {
      try {
        const exists = await this.redis.exists(key);
        return exists === 1;
      } catch (error) {
        console.error('Redis has error:', error);
      }
    }

    const entry = this.fallbackCache.get(key);
    if (!entry) return false;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.fallbackCache.delete(key);
      return false;
    }

    return true;
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  async invalidatePattern(pattern: string): Promise<number> {
    let count = 0;

    if (this.useRedis && this.redis) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          count = await this.redis.del(...keys);
        }
        return count;
      } catch (error) {
        console.error('Redis invalidatePattern error:', error);
      }
    }

    // Fallback to in-memory
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.fallbackCache.keys()) {
      if (regex.test(key)) {
        this.fallbackCache.delete(key);
        count++;
      }
    }

    return count;
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
    this.fallbackCache.clear();
  }
}
