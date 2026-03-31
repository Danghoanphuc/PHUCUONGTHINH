import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterService } from '../services/rate-limiter.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  // Different limits for different endpoints
  private readonly limits = {
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 requests per 15 minutes
    api: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
    default: { windowMs: 60 * 1000, maxRequests: 1000 }, // 1000 requests per minute
  };

  constructor(private rateLimiter: RateLimiterService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Skip rate limiting in development mode OR production (temporary fix)
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'production'
    ) {
      return next();
    }

    // Skip rate limiting for SSE endpoints (long-lived connections)
    if (req.path.includes('/events')) {
      return next();
    }

    // Get client IP
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown';

    // Determine which limit to apply
    let config = this.limits.default;

    if (
      req.path.includes('/auth/login') ||
      req.path.includes('/auth/refresh')
    ) {
      config = this.limits.auth;
    } else if (req.path.startsWith('/api/')) {
      config = this.limits.api;
    }

    // Check rate limit
    const key = `${clientIp}:${req.path}`;

    if (!this.rateLimiter.isAllowed(key, config)) {
      const resetTime = this.rateLimiter.getResetTime(key);
      const retryAfter = resetTime
        ? Math.ceil((resetTime - Date.now()) / 1000)
        : 60;

      res.setHeader('Retry-After', retryAfter);
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      if (resetTime) {
        res.setHeader('X-RateLimit-Reset', resetTime);
      }

      throw new HttpException(
        `Too many requests. Please try again after ${retryAfter} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Set rate limit headers
    const remaining = this.rateLimiter.getRemaining(key, config);
    const resetTime = this.rateLimiter.getResetTime(key);

    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    if (resetTime) {
      res.setHeader('X-RateLimit-Reset', resetTime);
    }

    next();
  }
}
