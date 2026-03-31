import { Injectable } from '@nestjs/common';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  maxSize?: number; // Maximum number of cached items
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

@Injectable()
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = (options.ttl || this.DEFAULT_TTL) * 1000; // Convert to milliseconds
    const maxSize = options.maxSize || this.MAX_CACHE_SIZE;

    // Evict expired entries and enforce size limit
    this.evictExpired();
    this.enforceSizeLimit(maxSize - 1); // -1 to make room for new entry

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);
  }

  /**
   * Delete cached data
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{
      key: string;
      size: number;
      accessCount: number;
      age: number;
      ttl: number;
    }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      size: this.estimateSize(entry.data),
      accessCount: entry.accessCount,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
    }));

    const totalAccesses = entries.reduce(
      (sum, entry) => sum + entry.accessCount,
      0,
    );
    const hitRate = totalAccesses > 0 ? entries.length / totalAccesses : 0;

    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate,
      entries,
    };
  }

  /**
   * Generate cache key for product filters
   */
  generateFilterCacheKey(filters: any): string {
    // Create a deterministic key from filter parameters
    const keyObject = {
      categories: filters.categories?.sort(),
      styles: filters.inspiration?.styles?.sort(),
      spaces: filters.inspiration?.spaces?.sort(),
      technical: filters.technical
        ? Object.keys(filters.technical)
            .sort()
            .reduce((obj: any, key) => {
              obj[key] = filters.technical[key];
              return obj;
            }, {})
        : undefined,
      search: filters.search,
      published: filters.published,
      page: filters.page,
      limit: filters.limit,
    };

    // Remove undefined values
    Object.keys(keyObject).forEach((key) => {
      if (keyObject[key] === undefined) {
        delete keyObject[key];
      }
    });

    return `filters:${Buffer.from(JSON.stringify(keyObject)).toString('base64')}`;
  }

  /**
   * Generate cache key for search results
   */
  generateSearchCacheKey(
    query: string,
    filters: any = {},
    pagination: any = {},
  ): string {
    const keyObject = {
      query: query.trim().toLowerCase(),
      filters,
      pagination,
    };

    return `search:${Buffer.from(JSON.stringify(keyObject)).toString('base64')}`;
  }

  /**
   * Cache wrapper for async functions
   */
  async cached<T>(
    key: string,
    fn: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    this.set(key, result, options);

    return result;
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Invalidate product-related cache entries
   */
  invalidateProductCache(productId?: string): number {
    if (productId) {
      return this.invalidatePattern(new RegExp(productId));
    } else {
      return this.invalidatePattern(
        new RegExp('^(filters|search|products|api:.*product)'),
      );
    }
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictExpired(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private enforceSizeLimit(maxSize: number): void {
    if (this.cache.size <= maxSize) {
      return;
    }

    // Sort entries by access pattern (LRU + access count)
    const entries = Array.from(this.cache.entries()).sort(([, a], [, b]) => {
      // Prefer keeping frequently accessed and recently accessed items
      const scoreA = a.accessCount * 0.7 + (Date.now() - a.lastAccessed) * -0.3;
      const scoreB = b.accessCount * 0.7 + (Date.now() - b.lastAccessed) * -0.3;
      return scoreA - scoreB;
    });

    // Remove least valuable entries
    const toRemove = this.cache.size - maxSize;
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  private estimateSize(data: any): number {
    // Rough estimation of data size in bytes
    try {
      return JSON.stringify(data).length * 2; // Approximate UTF-16 encoding
    } catch {
      return 1000; // Default estimate for non-serializable data
    }
  }
}
