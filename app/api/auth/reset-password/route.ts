import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, passwordResetTokens } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { hashPassword, validatePassword } from '@/lib/password-utils';
import type { ApiResponse } from '@/lib/types';

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet requirements',
          details: passwordValidation.errors 
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Find valid reset token
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gte(passwordResetTokens.expires, new Date())
        )
      )
      .limit(1);

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update user password
    await db
      .update(users)
      .set({ 
        passwordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, resetToken.userId));

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, resetToken.id));

    return NextResponse.json(
      { message: 'Password reset successfully' } as ApiResponse<never>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in reset password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/reset-password
 * Validate reset token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Check if token is valid
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gte(passwordResetTokens.expires, new Date())
        )
      )
      .limit(1);

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        data: { valid: true },
        message: 'Token is valid' 
      } as ApiResponse<{ valid: boolean }>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error validating reset token:', error);
    return NextResponse.json(
      { error: 'Failed to validate token' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}