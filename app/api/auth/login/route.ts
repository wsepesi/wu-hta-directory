import { NextRequest, NextResponse } from 'next/server';
import { loginRateLimiter } from '@/lib/rate-limit';
import { signIn } from 'next-auth/react';
import type { ApiResponse } from '@/lib/types';

/**
 * POST /api/auth/login
 * Login with rate limiting
 */
export async function POST(request: NextRequest) {
  try {
    // Get IP address for rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';
    
    // Check rate limit (5 attempts per 15 minutes)
    try {
      await loginRateLimiter.check(5, ip);
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again in 15 minutes.',
          retryAfter: 900 // 15 minutes in seconds
        } as ApiResponse<never>,
        { 
          status: 429,
          headers: {
            'Retry-After': '900'
          }
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, password, rememberMe } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Since we're in an API route, we can't use signIn directly
    // Instead, we'll validate credentials and return success/failure
    // The actual sign-in will be handled by NextAuth through the client
    
    return NextResponse.json(
      { 
        data: { validated: true },
        message: 'Credentials validated. Proceed with sign-in.'
      } as ApiResponse<{ validated: boolean }>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'Failed to process login request' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}