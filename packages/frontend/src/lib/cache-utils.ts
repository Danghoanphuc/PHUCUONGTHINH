/**
 * Client-side cache utilities for better performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  timerId: ReturnType<typeof setTimeout>;
}

class ClientCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 60_000; // 1 minute

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Lazy expiry check as a safety net (active cleanup via setTimeout is primary)
    if (Date.now() - entry.timestamp > entry.ttl) {
      this._evict(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    // Clear existing timer if key is being overwritten
    const existing = this.cache.get(key);
    if (existing) clearTimeout(existing.timerId);

    const timerId = setTimeout(() => this._evict(key), ttl);

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      timerId,
    });
  }

  delete(key: string): void {
    this._evict(key);
  }

  clear(): void {
    for (const key of this.cache.keys()) this._evict(key);
  }

  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) this._evict(key);
    }
  }

  invalidateProduct(productId?: string): void {
    if (productId) this.invalidatePattern(new RegExp(productId));
    this.invalidatePattern(/^products:/);
  }

  private _evict(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      clearTimeout(entry.timerId);
      this.cache.delete(key);
    }
  }
}

export const clientCache = new ClientCache();

// ========== Cache Busting for Real-time Media Updates ==========

/**
 * Adds cache-busting timestamp to any URL
 * Use this when media is newly uploaded or changed to prevent CDN/browser caching
 */
export function addCacheBuster(url: string, timestamp?: number): string {
  if (!url) return url;
  const ts = timestamp || Date.now();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${ts}`;
}

/**
 * Optimizes Cloudinary URL with transformations and optional cache busting
 */
export function optimizeCloudinaryUrl(
  url: string, 
  width?: number, 
  options: { 
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'avif' | 'jpg';
    cacheBust?: boolean;
    timestamp?: number;
  } = {}
): string {
  if (!url?.includes('cloudinary.com')) return url;
  
  const { quality = 'auto', format = 'auto', cacheBust = false, timestamp } = options;
  
  // Build transformation string
  const transforms: string[] = [];
  if (width) transforms.push(`w_${width}`);
  if (quality === 'auto') transforms.push('q_auto');
  else transforms.push(`q_${quality}`);
  if (format === 'auto') transforms.push('f_auto');
  else transforms.push(`f_${format}`);
  
  const transformStr = transforms.join(',');
  
  // Insert transformations into URL
  let optimized = url;
  if (url.includes('/upload/')) {
    optimized = url.replace('/upload/', `/upload/${transformStr}/`);
  }
  
  // Add cache buster if requested (critical for real-time updates)
  if (cacheBust) {
    optimized = addCacheBuster(optimized, timestamp);
  }
  
  return optimized;
}

/**
 * Force cache invalidation for a product's media
 * Call this after save/update to ensure fresh images immediately
 */
export function invalidateProductMediaCache(productId: string): void {
  if (typeof window === 'undefined') return;
  
  // Store timestamp in localStorage for this product
  const timestamp = Date.now().toString();
  localStorage.setItem(`product_${productId}_cache_bust`, timestamp);
  
  // Clear client cache for this product
  clientCache.invalidateProduct(productId);
  
  // Broadcast to other tabs
  window.dispatchEvent(new CustomEvent('product-media-updated', {
    detail: { productId, timestamp: Date.now() }
  }));
  
  console.log(`🧹 [Cache] Invalidated product ${productId} at ${new Date().toISOString()}`);
}

/**
 * Get cache bust timestamp for a product
 */
export function getProductCacheTimestamp(productId: string): number {
  if (typeof window === 'undefined') return Date.now();
  const stored = localStorage.getItem(`product_${productId}_cache_bust`);
  return stored ? parseInt(stored, 10) : 0;
}

/**
 * Clear browser cache for specific URLs
 */
export async function clearCacheForUrls(urls: string[]): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(async (cacheName) => {
        const cache = await caches.open(cacheName);
        await Promise.all(
          urls.map(async (url) => {
            await cache.delete(url);
          })
        );
      })
    );
    console.log(`🧹 [Cache] Cleared ${urls.length} URLs from browser cache`);
  } catch (err) {
    console.warn('Failed to clear cache:', err);
  }
}
