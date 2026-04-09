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
        return {
          get: async (key: string) => {
            return await redisCache.get(key);
          },
          set: async (key: string, data: any, options?: any) => {
            const ttl = options?.ttl || 300;
            await redisCache.set(key, data, ttl);
          },
          delete: async (key: string) => {
            return await redisCache.delete(key);
          },
          clear: async () => {
            await redisCache.clear();
          },
          has: async (key: string) => {
            return await redisCache.has(key);
          },
          cached: async (
            key: string,
            factory: () => Promise<any>,
            options?: { ttl?: number } | number,
          ) => {
            const ttl =
              typeof options === 'number' ? options : options?.ttl || 300;
            return await redisCache.getOrSet(key, factory, ttl);
          },
          generateFilterCacheKey: (filters: any) => {
            return `filters:${JSON.stringify(filters)}`;
          },
          invalidateProductCache: async (productId?: string) => {
            if (productId) {
              await redisCache.invalidatePattern(`product:${productId}*`);
              await redisCache.invalidatePattern(`*${productId}*`);
              return;
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
