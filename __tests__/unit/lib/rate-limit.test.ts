import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { rateLimit, loginRateLimiter, apiRateLimiter } from '@/lib/rate-limit';

describe('rate-limit', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('rateLimit', () => {
    it('should allow requests under the limit', async () => {
      const limiter = rateLimit({ interval: 60000 });
      const token = 'test-token';
      
      // First 4 requests should succeed
      for (let i = 0; i < 4; i++) {
        await expect(limiter.check(5, token)).resolves.toBeUndefined();
      }
    });

    it('should reject requests over the limit', async () => {
      const limiter = rateLimit({ interval: 60000 });
      const token = 'test-token';
      
      // First 5 requests should succeed
      for (let i = 0; i < 5; i++) {
        await expect(limiter.check(5, token)).resolves.toBeUndefined();
      }
      
      // 6th request should fail
      await expect(limiter.check(5, token)).rejects.toThrow('Rate limit exceeded');
    });

    it('should track different tokens separately', async () => {
      const limiter = rateLimit({ interval: 60000 });
      const token1 = 'token-1';
      const token2 = 'token-2';
      
      // 5 requests for token1
      for (let i = 0; i < 5; i++) {
        await expect(limiter.check(5, token1)).resolves.toBeUndefined();
      }
      
      // token1 should be rate limited
      await expect(limiter.check(5, token1)).rejects.toThrow('Rate limit exceeded');
      
      // token2 should still work
      await expect(limiter.check(5, token2)).resolves.toBeUndefined();
    });

    it('should reset after the interval expires', async () => {
      const limiter = rateLimit({ interval: 60000 }); // 1 minute
      const token = 'test-token';
      
      // Max out the limit
      for (let i = 0; i < 5; i++) {
        await expect(limiter.check(5, token)).resolves.toBeUndefined();
      }
      
      // Should be rate limited
      await expect(limiter.check(5, token)).rejects.toThrow('Rate limit exceeded');
      
      // Advance time by 61 seconds
      jest.advanceTimersByTime(61000);
      
      // Should work again
      await expect(limiter.check(5, token)).resolves.toBeUndefined();
    });

    it('should respect custom intervals', async () => {
      const limiter = rateLimit({ interval: 5000 }); // 5 seconds
      const token = 'test-token';
      
      // Use up the limit
      await limiter.check(1, token);
      await expect(limiter.check(1, token)).rejects.toThrow('Rate limit exceeded');
      
      // Advance time by 3 seconds (still within interval)
      jest.advanceTimersByTime(3000);
      await expect(limiter.check(1, token)).rejects.toThrow('Rate limit exceeded');
      
      // Advance time by 3 more seconds (total 6 seconds, past interval)
      jest.advanceTimersByTime(3000);
      await expect(limiter.check(1, token)).resolves.toBeUndefined();
    });

    it('should handle concurrent requests correctly', async () => {
      const limiter = rateLimit({ interval: 60000 });
      const token = 'test-token';
      
      // Make 5 concurrent requests
      const promises = Array(5).fill(null).map(() => limiter.check(5, token));
      await Promise.all(promises);
      
      // 6th request should fail
      await expect(limiter.check(5, token)).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('loginRateLimiter', () => {
    it('should have correct configuration', async () => {
      const token = 'test-ip';
      
      // Should allow 5 login attempts
      for (let i = 0; i < 5; i++) {
        await expect(loginRateLimiter.check(5, token)).resolves.toBeUndefined();
      }
      
      // 6th attempt should fail
      await expect(loginRateLimiter.check(5, token)).rejects.toThrow('Rate limit exceeded');
      
      // Should reset after 15 minutes
      jest.advanceTimersByTime(15 * 60 * 1000 + 1000);
      await expect(loginRateLimiter.check(5, token)).resolves.toBeUndefined();
    });
  });

  describe('apiRateLimiter', () => {
    it('should have correct configuration', async () => {
      const token = 'test-api-key';
      
      // Should allow many requests per minute
      for (let i = 0; i < 100; i++) {
        await expect(apiRateLimiter.check(100, token)).resolves.toBeUndefined();
      }
      
      // 101st request should fail
      await expect(apiRateLimiter.check(100, token)).rejects.toThrow('Rate limit exceeded');
      
      // Should reset after 1 minute
      jest.advanceTimersByTime(60 * 1000 + 1000);
      await expect(apiRateLimiter.check(100, token)).resolves.toBeUndefined();
    });
  });
});