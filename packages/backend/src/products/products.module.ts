import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CategoriesModule } from '../categories/categories.module';
import { InspirationFilterService } from './services/inspiration-filter.service';
import { TechnicalFilterService } from './services/technical-filter.service';
import { CombinedFilterService } from './services/combined-filter.service';
import { SearchService } from './services/search.service';
import { PaginationService } from './services/pagination.service';
import { CacheService } from './services/cache.service';
import { PerformanceService } from './services/performance.service';
import { ProductsEventService } from './products-events.service';
import { RedisCacheService } from '../common/services/redis-cache.service';

// Provide RedisCacheService as CacheService for backward compatibility
@Module({
  imports: [PrismaModule, CategoriesModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductsEventService,
    InspirationFilterService,
    TechnicalFilterService,
    CombinedFilterService,
    SearchService,
    PaginationService,
    {
      provide: CacheService,
      useFactory: (redisCache: RedisCacheService) => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔧 Creating CacheService adapter with Redis');
        }
        // Adapter to make RedisCacheService compatible with CacheService interface
        return {
          get: async (key: string) => {
            if (process.env.NODE_ENV !== 'production') {
              console.log(`📖 Cache GET: ${key}`);
            }
            return await redisCache.get(key);
          },
          set: async (key: string, data: any, options?: any) => {
            const ttl = options?.ttl || 300;
            if (process.env.NODE_ENV !== 'production') {
              console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
            }
            await redisCache.set(key, data, ttl);
          },
          delete: async (key: string) => {
            if (process.env.NODE_ENV !== 'production') {
              console.log(`🗑️  Cache DELETE: ${key}`);
            }
            return await redisCache.delete(key);
          },
          clear: async () => {
            console.log('🧹 Cache CLEAR ALL');
            await redisCache.clear();
          },
          has: async (key: string) => {
            return await redisCache.has(key);
          },
          // Additional methods for compatibility
          cached: async (
            key: string,
            factory: () => Promise<any>,
            ttl = 300,
          ) => {
            console.log(`🔍 Cache LOOKUP: ${key}`);
            const result = await redisCache.getOrSet(key, factory, ttl);
            console.log(`${result ? '✅ HIT' : '❌ MISS'}: ${key}`);
            return result;
          },
          generateFilterCacheKey: (filters: any) => {
            return `filters:${JSON.stringify(filters)}`;
          },
          invalidateProductCache: async (productId?: string) => {
            if (productId) {
              if (process.env.NODE_ENV !== 'production') {
                console.log(`🗑️  Invalidating cache for product: ${productId}`);
              }
              await redisCache.invalidatePattern(`product:${productId}*`);
              await redisCache.invalidatePattern(`*${productId}*`);
              return;
            }
            if (process.env.NODE_ENV !== 'production') {
              console.log('🗑️  Invalidating all product caches');
            }
            await redisCache.invalidatePattern('product:*');
            await redisCache.invalidatePattern('api:*products*');
            await redisCache.invalidatePattern('api:*product*');
          },
          getStats: () => {
            return { message: 'Using Redis cache', type: 'redis' };
          },
        };
      },
      inject: [RedisCacheService],
    },
    PerformanceService,
  ],
  exports: [ProductsService, CombinedFilterService, ProductsEventService],
})
export class ProductsModule {}
