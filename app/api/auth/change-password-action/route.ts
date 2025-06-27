import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userRepository } from '@/lib/repositories/users';
import { validatePassword, verifyPassword, hashPassword } from '@/lib/password-utils';
import { authLogger } from '@/lib/logger';

/**
 * POST /api/auth/change-password-action
 * Server-side form action for progressive enhancement
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('callbackUrl', '/auth/change-password');
      return NextResponse.redirect(url);
    }

    // Parse form data
    const formData = await request.formData();
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const isNoJS = formData.get('_no_js') === 'true';

    authLogger.info('Change password attempt (form action)', {
      userId: session.user.id,
      isNoJS,
    });

    // Build error URL
    const buildErrorUrl = (error: string, field?: string) => {
      const url = new URL('/auth/change-password', request.url);
      url.searchParams.set('error', error);
      if (field) url.searchParams.set('field', field);
      return url;
    };

    // Validate required fields
    if (!currentPassword) {
      return NextResponse.redirect(
        buildErrorUrl('Current password is required', 'currentPassword')
      );
    }

    if (!newPassword) {
      return NextResponse.redirect(
        buildErrorUrl('New password is required', 'newPassword')
      );
    }

    if (!confirmPassword) {
      return NextResponse.redirect(
        buildErrorUrl('Please confirm your new password', 'confirmPassword')
      );
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.redirect(
        buildErrorUrl('Passwords do not match', 'confirmPassword')
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.redirect(
        buildErrorUrl(
          `Password does not meet requirements: ${passwordValidation.errors.join(', ')}`,
          'newPassword'
        )
      );
    }

    // Check if new password is different from current
    if (newPassword === currentPassword) {
      return NextResponse.redirect(
        buildErrorUrl('New password must be different from current password', 'newPassword')
      );
    }

    // Get user with password hash
    const user = await userRepository.findByIdWithPassword(session.user.id);
    if (!user) {
      return NextResponse.redirect(
        buildErrorUrl('User not found')
      );
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.redirect(
        buildErrorUrl('Current password is incorrect', 'currentPassword')
      );
    }

    // Hash and update password
    const hashedPassword = await hashPassword(newPassword);
    await userRepository.updatePassword(user.id, hashedPassword);

    authLogger.info('Password changed successfully (form action)', {
      userId: user.id,
      duration: Date.now() - startTime
    });

    // Redirect to profile with success message
    const successUrl = new URL('/profile', request.url);
    successUrl.searchParams.set('success', 'password_changed');
    return NextResponse.redirect(successUrl);
    
  } catch (error) {
    authLogger.error('Change password action error', error, {
      duration: Date.now() - startTime
    });
    
    const url = new URL('/auth/change-password', request.url);
    url.searchParams.set('error', 'An error occurred. Please try again.');
    return NextResponse.redirect(url);
  }
}