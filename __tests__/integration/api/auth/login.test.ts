import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '@/app/api/auth/login/route';
import { loginRateLimiter } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

// Mock rate limiter
jest.mock('@/lib/rate-limit', () => ({
  loginRateLimiter: {
    check: jest.fn(),
  },
}));

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate credentials successfully', async () => {
    (loginRateLimiter.check as jest.Mock).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '192.168.1.1',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual({ validated: true });
    expect(data.message).toBe('Credentials validated. Proceed with sign-in.');
    expect(loginRateLimiter.check).toHaveBeenCalledWith(5, '192.168.1.1');
  });

  it('should reject request without email or password', async () => {
    (loginRateLimiter.check as jest.Mock).mockResolvedValue(undefined);

    const testCases = [
      { email: '', password: 'password' },
      { email: 'test@example.com', password: '' },
      { email: '', password: '' },
      { password: 'password' }, // missing email
      { email: 'test@example.com' }, // missing password
      {}, // empty body
    ];

    for (const body of testCases) {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and password are required');
    }
  });

  it('should enforce rate limiting', async () => {
    (loginRateLimiter.check as jest.Mock).mockRejectedValue(new Error('Rate limit exceeded'));

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '192.168.1.1',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('Too many login attempts. Please try again in 15 minutes.');
    expect(data.retryAfter).toBe(900);
    expect(response.headers.get('Retry-After')).toBe('900');
  });

  it('should use IP from request.ip if available', async () => {
    (loginRateLimiter.check as jest.Mock).mockResolvedValue(undefined);

    // Create a mock request with ip property
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });
    
    // Mock the ip property
    Object.defineProperty(request, 'ip', {
      value: '10.0.0.1',
      writable: false,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(loginRateLimiter.check).toHaveBeenCalledWith(5, '10.0.0.1');
  });

  it('should use anonymous identifier if no IP is available', async () => {
    (loginRateLimiter.check as jest.Mock).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(loginRateLimiter.check).toHaveBeenCalledWith(5, 'anonymous');
  });

  it('should handle rate limiter errors gracefully', async () => {
    (loginRateLimiter.check as jest.Mock).mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to process login request');
  });

  it('should handle JSON parsing errors', async () => {
    (loginRateLimiter.check as jest.Mock).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to process login request');
  });

  it('should validate with rememberMe flag', async () => {
    (loginRateLimiter.check as jest.Mock).mockResolvedValue(undefined);

    const testCases = [true, false, undefined];

    for (const rememberMe of testCases) {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          rememberMe,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual({ validated: true });
    }
  });
});