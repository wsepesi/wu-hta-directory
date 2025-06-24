import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, passwordResetTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { sendPasswordResetEmail, isEmailConfigured } from '@/lib/email-service';
import type { ApiResponse } from '@/lib/types';

/**
 * POST /api/auth/forgot-password
 * Request a password reset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        { 
          message: 'If an account exists with this email, you will receive a password reset link.' 
        } as ApiResponse<never>,
        { status: 200 }
      );
    }

    // Generate reset token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    // Save reset token
    await db.insert(passwordResetTokens).values({
      token,
      userId: user.id,
      expires,
    });

    // Send email if configured
    if (isEmailConfigured()) {
      const emailResult = await sendPasswordResetEmail({
        to: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        resetToken: token,
        expirationHours: 2,
      });

      if (!emailResult.success) {
        console.error('Failed to send password reset email:', emailResult.error);
      }
    } else {
      console.warn('Email service not configured. Password reset token created but email not sent.');
      console.log(`Password reset token for ${user.email}: ${token}`);
    }

    return NextResponse.json(
      { 
        message: 'If an account exists with this email, you will receive a password reset link.' 
      } as ApiResponse<never>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json(
      { error: 'Failed to process request' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}