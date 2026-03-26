import { Controller, Get } from '@nestjs/common';
import { RedisCacheService } from '../services/redis-cache.service';

@Controller('health')
export class RedisStatusController {
  constructor(private redisCacheService: RedisCacheService) {}

  @Get('redis')
  async getRedisStatus() {
    const testKey = 'health_check_test';
    const testValue = { timestamp: Date.now(), test: true };

    try {
      // Try to set a value
      await this.redisCacheService.set(testKey, testValue, 10);

      // Try to get it back
      const retrieved = await this.redisCacheService.get(testKey);

      // Clean up
      await this.redisCacheService.delete(testKey);

      return {
        status: 'connected',
        redis_working: retrieved !== null,
        test_passed: JSON.stringify(retrieved) === JSON.stringify(testValue),
        message: 'Redis is working correctly',
      };
    } catch (error) {
      return {
        status: 'error',
        redis_working: false,
        message: error.message,
        fallback: 'Using in-memory cache',
      };
    }
  }
}
