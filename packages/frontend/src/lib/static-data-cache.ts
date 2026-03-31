import { Category } from "./category-service";
import { Tag } from "./tag-service";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_KEYS = {
  CATEGORIES: "static_cache_categories",
  STYLES: "static_cache_styles",
  SPACES: "static_cache_spaces",
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

function getFromCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    if (isCacheValid(entry.timestamp)) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`✅ Cache hit for ${key}`);
      }
      return entry.data;
    }

    // Cache expired
    localStorage.removeItem(key);
    if (process.env.NODE_ENV !== "production") {
      console.log(`⏰ Cache expired for ${key}`);
    }
    return null;
  } catch {
    return null;
  }
}

function setToCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;

  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
    if (process.env.NODE_ENV !== "production") {
      console.log(`💾 Cached ${key}`);
    }
  } catch (err) {
    console.warn("Failed to cache data:", err);
  }
}

export const staticDataCache = {
  getCategories(): Category[] | null {
    return getFromCache<Category[]>(CACHE_KEYS.CATEGORIES);
  },

  setCategories(data: Category[]): void {
    setToCache(CACHE_KEYS.CATEGORIES, data);
  },

  getStyles(): Tag[] | null {
    return getFromCache<Tag[]>(CACHE_KEYS.STYLES);
  },

  setStyles(data: Tag[]): void {
    setToCache(CACHE_KEYS.STYLES, data);
  },

  getSpaces(): Tag[] | null {
    return getFromCache<Tag[]>(CACHE_KEYS.SPACES);
  },

  setSpaces(data: Tag[]): void {
    setToCache(CACHE_KEYS.SPACES, data);
  },

  clearAll(): void {
    if (typeof window === "undefined") return;
    Object.values(CACHE_KEYS).forEach((key) => localStorage.removeItem(key));
    if (process.env.NODE_ENV !== "production") {
      console.log("🗑️ Cleared all static data cache");
    }
  },
};
