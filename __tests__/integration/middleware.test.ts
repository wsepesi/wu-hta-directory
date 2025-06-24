import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { middleware } from '@/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

describe('middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow access to public routes without authentication', async () => {
    const publicRoutes = [
      '/',
      '/auth/login',
      '/auth/register',
      '/api/auth/signin',
      '/api/auth/signup',
      '/api/invitations/validate',
    ];

    for (const route of publicRoutes) {
      const request = new NextRequest(`http://localhost:3000${route}`);
      const response = await middleware(request);

      // Should return NextResponse.next() or undefined for allowed routes
      expect(response).toBeUndefined();
    }
  });

  it('should redirect unauthenticated users from protected routes', async () => {
    (getToken as jest.Mock).mockResolvedValue(null);

    const protectedRoutes = [
      '/profile',
      '/manage/invitations',
      '/admin',
      '/admin/users',
      '/api/users',
      '/api/admin/stats',
    ];

    for (const route of protectedRoutes) {
      const request = new NextRequest(`http://localhost:3000${route}`);
      const response = await middleware(request);

      if (route.startsWith('/api/')) {
        // API routes should return 401
        expect(response?.status).toBe(401);
        const data = await response?.json();
        expect(data.error).toBe('Unauthorized');
      } else {
        // Web routes should redirect to login
        expect(response?.status).toBe(307);
        const location = response?.headers.get('location');
        expect(location).toContain('/auth/login');
        expect(location).toContain(`callbackUrl=${encodeURIComponent(route)}`);
      }
    }
  });

  it('should allow authenticated users to access protected routes', async () => {
    const mockToken = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'head_ta',
    };

    (getToken as jest.Mock).mockResolvedValue(mockToken);

    const protectedRoutes = [
      '/profile',
      '/manage/invitations',
      '/api/users',
    ];

    for (const route of protectedRoutes) {
      const request = new NextRequest(`http://localhost:3000${route}`);
      const response = await middleware(request);

      // Should allow access
      expect(response).toBeUndefined();
    }
  });

  it('should enforce admin-only routes', async () => {
    const nonAdminToken = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'head_ta',
    };

    (getToken as jest.Mock).mockResolvedValue(nonAdminToken);

    const adminRoutes = [
      '/admin',
      '/admin/users',
      '/admin/analytics',
      '/api/admin/stats',
      '/api/admin/users',
      '/api/admin/activities',
    ];

    for (const route of adminRoutes) {
      const request = new NextRequest(`http://localhost:3000${route}`);
      const response = await middleware(request);

      if (route.startsWith('/api/')) {
        // API routes should return 403
        expect(response?.status).toBe(403);
        const data = await response?.json();
        expect(data.error).toBe('Forbidden - Admin access required');
      } else {
        // Web routes should redirect to unauthorized
        expect(response?.status).toBe(307);
        const location = response?.headers.get('location');
        expect(location).toBe('/unauthorized');
      }
    }
  });

  it('should allow admin users to access admin routes', async () => {
    const adminToken = {
      sub: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    };

    (getToken as jest.Mock).mockResolvedValue(adminToken);

    const adminRoutes = [
      '/admin',
      '/admin/users',
      '/api/admin/stats',
      '/api/admin/users',
    ];

    for (const route of adminRoutes) {
      const request = new NextRequest(`http://localhost:3000${route}`);
      const response = await middleware(request);

      // Should allow access
      expect(response).toBeUndefined();
    }
  });

  it('should handle missing role in token', async () => {
    const tokenWithoutRole = {
      sub: 'user-123',
      email: 'test@example.com',
      // role is missing
    };

    (getToken as jest.Mock).mockResolvedValue(tokenWithoutRole);

    const request = new NextRequest('http://localhost:3000/admin');
    const response = await middleware(request);

    // Should redirect to unauthorized
    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toBe('/unauthorized');
  });

  it('should handle getToken errors gracefully', async () => {
    (getToken as jest.Mock).mockRejectedValue(new Error('Token error'));

    const request = new NextRequest('http://localhost:3000/profile');
    const response = await middleware(request);

    // Should redirect to login on error
    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toContain('/auth/login');
  });

  it('should preserve query parameters in callback URL', async () => {
    (getToken as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/profile?tab=settings&view=advanced');
    const response = await middleware(request);

    expect(response?.status).toBe(307);
    const location = response?.headers.get('location');
    expect(location).toContain('/auth/login');
    expect(location).toContain(encodeURIComponent('/profile?tab=settings&view=advanced'));
  });

  it('should handle API route authorization with proper error responses', async () => {
    const testCases = [
      {
        token: null,
        route: '/api/users',
        expectedStatus: 401,
        expectedError: 'Unauthorized',
      },
      {
        token: { sub: 'user-123', role: 'head_ta' },
        route: '/api/admin/stats',
        expectedStatus: 403,
        expectedError: 'Forbidden - Admin access required',
      },
      {
        token: { sub: 'admin-123', role: 'admin' },
        route: '/api/admin/stats',
        expectedStatus: undefined, // Should pass through
      },
    ];

    for (const testCase of testCases) {
      (getToken as jest.Mock).mockResolvedValue(testCase.token);

      const request = new NextRequest(`http://localhost:3000${testCase.route}`);
      const response = await middleware(request);

      if (testCase.expectedStatus) {
        expect(response?.status).toBe(testCase.expectedStatus);
        const data = await response?.json();
        expect(data.error).toBe(testCase.expectedError);
      } else {
        expect(response).toBeUndefined();
      }
    }
  });
});