// @ts-ignore - LRU Cache v11 has built-in types
import { LRUCache } from 'lru-cache';

export type RateLimitOptions = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export function rateLimit(options?: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000, // 60 seconds default
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;
        
        if (isRateLimited) {
          reject(new Error('Rate limit exceeded'));
        } else {
          resolve();
        }
      }),
  };
}

// Pre-configured rate limiters
export const loginRateLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500,
});

export const apiRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 1000,
});