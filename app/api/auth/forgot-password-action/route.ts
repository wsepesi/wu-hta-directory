import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/repositories/users';
import { sendPasswordResetEmail, isEmailConfigured } from '@/lib/email-service';
import { authLogger } from '@/lib/logger';
import crypto from 'crypto';

/**
 * POST /api/auth/forgot-password-action
 * Server-side form action for progressive enhancement
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse form data
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const isNoJS = formData.get('_no_js') === 'true';

    authLogger.info('Forgot password attempt (form action)', {
      email: email?.toLowerCase(),
      isNoJS,
    });

    // Validate email
    if (!email) {
      const url = new URL('/auth/forgot-password', request.url);
      url.searchParams.set('error', 'Please enter your email address');
      return NextResponse.redirect(url);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const url = new URL('/auth/forgot-password', request.url);
      url.searchParams.set('error', 'Please enter a valid email address');
      url.searchParams.set('email', email);
      return NextResponse.redirect(url);
    }

    // Check if user exists
    const user = await userRepository.findByEmail(email);
    
    if (user && isEmailConfigured()) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
      
      // Save reset token in passwordResetTokens table
      const { passwordResetTokens } = await import('@/lib/db/schema');
      const { db } = await import('@/lib/db');
      
      await db.insert(passwordResetTokens).values({
        token: resetToken,
        userId: user.id,
        expires: resetTokenExpiry,
        used: false,
      });
      
      // Send reset email
      const emailResult = await sendPasswordResetEmail({
        to: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        resetToken: resetToken,
        expirationHours: 1,
      });
      
      if (!emailResult.success) {
        authLogger.error('Failed to send password reset email', emailResult.error, {
          userId: user.id,
          email: user.email
        });
      } else {
        authLogger.info('Password reset email sent', {
          userId: user.id,
          email: user.email,
          duration: Date.now() - startTime
        });
      }
    }
    
    // Always show success to prevent email enumeration
    const successUrl = new URL('/auth/forgot-password', request.url);
    successUrl.searchParams.set('success', 'reset_email_sent');
    successUrl.searchParams.set('email', email);
    return NextResponse.redirect(successUrl);
    
  } catch (error) {
    authLogger.error('Forgot password action error', error, {
      duration: Date.now() - startTime
    });
    
    const url = new URL('/auth/forgot-password', request.url);
    url.searchParams.set('error', 'An error occurred. Please try again.');
    return NextResponse.redirect(url);
  }
}