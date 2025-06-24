/**
 * Simple in-memory cache implementation for frequently accessed data
 * In production, this could be replaced with Redis or another caching solution
 */

import { logError } from './error-logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Run cleanup every minute
    this.startCleanup();
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set data in cache with TTL (time to live) in milliseconds
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear cache entries matching a pattern
   */
  clearPattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get or set cache with a factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check if data exists in cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    try {
      // Fetch fresh data
      const data = await factory();
      
      // Store in cache
      this.set(key, data, ttl);
      
      return data;
    } catch (error) {
      logError(error as Error, { metadata: { cacheKey: key } });
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let totalSize = 0;
    let expiredCount = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      totalSize += JSON.stringify(entry.data).length;
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++;
      }
    }
    
    return {
      entries: this.cache.size,
      expiredEntries: expiredCount,
      approximateSizeBytes: totalSize,
    };
  }

  /**
   * Start automatic cleanup of expired entries
   */
  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, 60 * 1000); // Run every minute
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const cache = new CacheManager();

// Cache key generators for consistency
export const cacheKeys = {
  // User-related keys
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  userList: (page: number, limit: number) => `users:page:${page}:limit:${limit}`,
  
  // Course-related keys
  course: (id: string) => `course:${id}`,
  courseByNumber: (number: string) => `course:number:${number}`,
  courseList: () => 'courses:all',
  courseOfferings: (courseId: string) => `course:${courseId}:offerings`,
  
  // Professor-related keys
  professor: (id: string) => `professor:${id}`,
  professorList: () => 'professors:all',
  
  // TA Assignment keys
  taAssignment: (id: string) => `ta-assignment:${id}`,
  userAssignments: (userId: string) => `user:${userId}:assignments`,
  courseOfferingAssignments: (offeringId: string) => `offering:${offeringId}:assignments`,
  
  // Search keys
  search: (query: string, type?: string) => `search:${type || 'all'}:${query}`,
  
  // Directory keys
  publicDirectory: () => 'directory:public',
  directoryFiltered: (filters: Record<string, any>) => `directory:filtered:${JSON.stringify(filters)}`,
  
  // Analytics keys
  userGrowth: (period: string) => `analytics:user-growth:${period}`,
  stats: () => 'admin:stats',
};

// Cache TTL presets (in milliseconds)
export const cacheTTL = {
  short: 30 * 1000,        // 30 seconds
  medium: 5 * 60 * 1000,   // 5 minutes
  long: 30 * 60 * 1000,    // 30 minutes
  hour: 60 * 60 * 1000,    // 1 hour
  day: 24 * 60 * 60 * 1000 // 24 hours
};

// Decorator for caching method results
export function Cacheable(keyGenerator: (...args: any[]) => string, ttl?: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator(...args);
      
      return cache.getOrSet(
        cacheKey,
        () => originalMethod.apply(this, args),
        ttl
      );
    };
    
    return descriptor;
  };
}

// React hook for using cache
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttl?: number;
    staleWhileRevalidate?: boolean;
  }
) {
  const { ttl = cacheTTL.medium, staleWhileRevalidate = true } = options || {};
  
  return {
    getData: async () => {
      if (staleWhileRevalidate) {
        // Return stale data immediately if available
        const stale = cache.get<T>(key);
        if (stale !== null) {
          // Revalidate in background
          fetcher().then(fresh => cache.set(key, fresh, ttl)).catch(console.error);
          return stale;
        }
      }
      
      return cache.getOrSet(key, fetcher, ttl);
    },
    invalidate: () => cache.delete(key),
    prefetch: () => cache.getOrSet(key, fetcher, ttl),
  };
}