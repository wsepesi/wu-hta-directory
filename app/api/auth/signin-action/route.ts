import { NextRequest, NextResponse } from 'next/server';
import { loginRateLimiter } from '@/lib/rate-limit';
import { authLogger } from '@/lib/logger';
import { userRepository } from '@/lib/repositories/users';
import { verifyPassword } from '@/lib/password-utils';
import { encode } from 'next-auth/jwt';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/signin-action
 * Server-side form action for progressive enhancement
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // Get IP address for rate limiting
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             request.headers.get('cf-connecting-ip') || 
             'anonymous';
  
  try {
    // Check rate limit
    try {
      await loginRateLimiter.check(5, ip);
    } catch {
      // For non-JS clients, redirect with error
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('error', 'rate_limit');
      return NextResponse.redirect(url);
    }

    // Parse form data
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const rememberMe = formData.get('rememberMe') === 'on';
    const callbackUrl = formData.get('callbackUrl') as string || '/dashboard';
    const isNoJS = formData.get('_no_js') === 'true';

    // Validate required fields
    if (!email || !password) {
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('error', 'missing_fields');
      return NextResponse.redirect(url);
    }

    authLogger.info('Sign-in attempt (form action)', {
      email: email.toLowerCase(),
      ip,
      isNoJS,
      duration: Date.now() - startTime
    });

    // Attempt sign in manually
    try {
      // Find user by email
      const user = await userRepository.findByEmailWithPassword(email);
      
      if (!user) {
        authLogger.warn('Sign-in failed: user not found (form action)', {
          email: email.toLowerCase(),
          duration: Date.now() - startTime
        });
        const url = new URL('/auth/signin', request.url);
        url.searchParams.set('error', 'invalid_credentials');
        url.searchParams.set('email', email);
        return NextResponse.redirect(url);
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.passwordHash);
      
      if (!isValidPassword) {
        authLogger.warn('Sign-in failed: invalid password (form action)', {
          email: email.toLowerCase(),
          userId: user.id,
          duration: Date.now() - startTime
        });
        const url = new URL('/auth/signin', request.url);
        url.searchParams.set('error', 'invalid_credentials');
        url.searchParams.set('email', email);
        return NextResponse.redirect(url);
      }

      // Create session token
      const token = await encode({
        token: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        secret: process.env.NEXTAUTH_SECRET!,
        maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days if remember me, else 24 hours
      });

      // Set session cookie
      const cookieStore = await cookies();
      cookieStore.set('next-auth.session-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      });

      authLogger.info('Sign-in successful (form action)', {
        email: user.email,
        userId: user.id,
        role: user.role,
        rememberMe,
        duration: Date.now() - startTime
      });

      // Successful sign in - redirect to callback URL
      return NextResponse.redirect(new URL(callbackUrl, request.url));
    } catch (error) {
      authLogger.error('Sign-in action error', error, {
        email: email.toLowerCase(),
        duration: Date.now() - startTime
      });
      
      // Failed sign in - redirect back with error
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('error', 'server_error');
      url.searchParams.set('email', email);
      return NextResponse.redirect(url);
    }
  } catch (error) {
    authLogger.error('Sign-in action error', error, {
      ip,
      duration: Date.now() - startTime
    });
    
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('error', 'server_error');
    return NextResponse.redirect(url);
  }
}