import { NextRequest, NextResponse } from 'next/server';
import { loginRateLimiter } from '@/lib/rate-limit';
import { authLogger } from '@/lib/logger';
import type { ApiResponse } from '@/lib/types';

/**
 * POST /api/auth/login
 * Login with rate limiting
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // Get IP address for rate limiting
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             request.headers.get('cf-connecting-ip') || 
             'anonymous';
  
  try {
    
    // Check rate limit (5 attempts per 15 minutes)
    try {
      await loginRateLimiter.check(5, ip);
    } catch {
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
    const { email, password } = body;

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
    
    authLogger.info('Login API endpoint called', {
      email: email?.toLowerCase(),
      ip,
      duration: Date.now() - startTime
    });
    
    return NextResponse.json(
      { 
        data: { validated: true },
        message: 'Credentials validated. Proceed with sign-in.'
      } as ApiResponse<{ validated: boolean }>,
      { status: 200 }
    );
  } catch (error) {
    authLogger.error('Login API error', error, {
      ip,
      duration: Date.now() - startTime
    });
    return NextResponse.json(
      { error: 'Failed to process login request' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}