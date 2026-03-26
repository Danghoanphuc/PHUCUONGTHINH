import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { LoggerService } from './services/logger.service';
import { CacheService } from './services/cache.service';
import { RedisCacheService } from './services/redis-cache.service';
import { DatabaseOptimizationService } from './services/database-optimization.service';
import { CdnCachingService } from './services/cdn-caching.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { SecurityHeadersService } from './services/security-headers.service';
import { QueryPerformanceService } from './services/query-performance.service';
import { PerformanceController } from './controllers/performance.controller';
import { SecurityController } from './controllers/security.controller';
import { QueryPerformanceController } from './controllers/query-performance.controller';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [
    PerformanceController,
    SecurityController,
    QueryPerformanceController,
  ],
  providers: [
    LoggerService,
    CacheService,
    RedisCacheService,
    DatabaseOptimizationService,
    CdnCachingService,
    RateLimiterService,
    SecurityHeadersService,
    QueryPerformanceService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
  exports: [
    LoggerService,
    CacheService,
    RedisCacheService,
    DatabaseOptimizationService,
    CdnCachingService,
    RateLimiterService,
    SecurityHeadersService,
    QueryPerformanceService,
  ],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityHeadersMiddleware, RateLimitMiddleware)
      .forRoutes('*');
  }
}
