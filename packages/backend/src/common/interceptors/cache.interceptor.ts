import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';

/**
 * 🚀 EXTREME Performance Cache Interceptor
 * Automatically caches GET requests with smart TTL
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private readonly cacheService: CacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    // Generate cache key from URL and query params
    const cacheKey = this.generateCacheKey(request);

    // Try to get from cache
    const cachedResponse = this.cacheService.get(cacheKey);
    if (cachedResponse) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`⚡ Cache HIT: ${cacheKey}`);
      }
      return of(cachedResponse);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`💾 Cache MISS: ${cacheKey}`);
    }

    // Execute request and cache the response
    return next.handle().pipe(
      tap((response) => {
        // Smart TTL based on endpoint
        const ttl = this.getSmartTTL(request.url);
        this.cacheService.set(cacheKey, response, ttl);
      }),
    );
  }

  private generateCacheKey(request: any): string {
    const url = request.url;
    const query = JSON.stringify(request.query || {});
    return `api:${url}:${query}`;
  }

  private getSmartTTL(url: string): number {
    // Products list - cache 5 minutes
    if (url.includes('/products') && !url.includes('/products/')) {
      return 300;
    }

    // Single product - cache 10 minutes
    if (url.match(/\/products\/[^/]+$/)) {
      return 600;
    }

    // Categories - cache 30 minutes (rarely change)
    if (url.includes('/categories')) {
      return 1800;
    }

    // Styles/Spaces - cache 1 hour (rarely change)
    if (url.includes('/styles') || url.includes('/spaces')) {
      return 3600;
    }

    // Media - cache 15 minutes
    if (url.includes('/media')) {
      return 900;
    }

    // Default - cache 2 minutes
    return 120;
  }
}
