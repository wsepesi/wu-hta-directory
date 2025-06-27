import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/repositories/users';
import { validatePassword } from '@/lib/password-utils';
import { authLogger } from '@/lib/logger';
import { hash } from 'bcryptjs';

/**
 * POST /api/auth/reset-password-action
 * Server-side form action for progressive enhancement
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse form data
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const isNoJS = formData.get('_no_js') === 'true';

    authLogger.info('Reset password attempt (form action)', {
      hasToken: !!token,
      isNoJS,
    });

    // Build error URL
    const buildErrorUrl = (error: string, code?: string) => {
      const url = new URL('/auth/reset-password', request.url);
      url.searchParams.set('error', error);
      if (code) url.searchParams.set('code', code);
      if (token) url.searchParams.set('token', token);
      return url;
    };

    // Validate token
    if (!token) {
      return NextResponse.redirect(
        buildErrorUrl('Invalid reset link. Please request a new password reset.', 'invalid_token')
      );
    }

    // Validate passwords
    if (!password) {
      return NextResponse.redirect(
        buildErrorUrl('Please enter a new password', 'missing_password')
      );
    }

    if (!confirmPassword) {
      return NextResponse.redirect(
        buildErrorUrl('Please confirm your new password', 'missing_confirm')
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.redirect(
        buildErrorUrl('Passwords do not match', 'password_mismatch')
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.redirect(
        buildErrorUrl(
          `Password does not meet requirements: ${passwordValidation.errors.join(', ')}`,
          'weak_password'
        )
      );
    }

    // Find user by reset token
    const { passwordResetTokens, users } = await import('@/lib/db/schema');
    const { db } = await import('@/lib/db');
    const { eq, and, gt } = await import('drizzle-orm');
    
    const [resetToken] = await db
      .select({
        token: passwordResetTokens,
        user: users,
      })
      .from(passwordResetTokens)
      .innerJoin(users, eq(passwordResetTokens.userId, users.id))
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expires, new Date())
        )
      )
      .limit(1);
    
    if (!resetToken) {
      return NextResponse.redirect(
        buildErrorUrl('Invalid or expired reset link. Please request a new password reset.', 'expired_token')
      );
    }

    // Update password
    const passwordHash = await hash(password, 10);
    await userRepository.updatePassword(resetToken.user.id, passwordHash);
    
    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, resetToken.token.id));

    authLogger.info('Password reset successful (form action)', {
      userId: resetToken.user.id,
      email: resetToken.user.email,
      duration: Date.now() - startTime
    });

    // Redirect to sign in with success message
    const successUrl = new URL('/auth/signin', request.url);
    successUrl.searchParams.set('success', 'password_reset');
    successUrl.searchParams.set('email', resetToken.user.email);
    return NextResponse.redirect(successUrl);
    
  } catch (error) {
    authLogger.error('Reset password action error', error, {
      duration: Date.now() - startTime
    });
    
    const url = new URL('/auth/reset-password', request.url);
    url.searchParams.set('error', 'An error occurred. Please try again.');
    return NextResponse.redirect(url);
  }
}