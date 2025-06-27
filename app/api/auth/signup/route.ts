import { NextRequest, NextResponse } from 'next/server';
import { invitationRepository } from '@/lib/repositories/invitations';
import { userRepository } from '@/lib/repositories/users';
import { sendWelcomeEmail, isEmailConfigured } from '@/lib/email-service';
import { validatePassword } from '@/lib/password-utils';
import { authLogger } from '@/lib/logger';
import type { ApiResponse, User } from '@/lib/types';

/**
 * POST /api/auth/signup
 * Complete signup with invitation token
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let email: string | undefined;
  
  try {
    // Parse request body
    const body = await request.json();
    const { 
      token,
      password,
      firstName,
      lastName,
      gradYear,
      degreeProgram,
      currentRole,
      linkedinUrl,
      personalSite,
      location
    } = body;
    
    email = body.email;

    // Log signup attempt
    authLogger.info('Signup attempt', {
      email: email?.toLowerCase(),
      hasToken: !!token,
      firstName,
      lastName,
      gradYear
    });

    // Validate required fields
    const missingFields = [];
    if (!token) missingFields.push('invitation token');
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');
    if (!firstName) missingFields.push('first name');
    if (!lastName) missingFields.push('last name');
    
    if (missingFields.length > 0) {
      authLogger.warn('Signup failed: missing fields', {
        email: email?.toLowerCase(),
        missingFields,
        duration: Date.now() - startTime
      });
      return NextResponse.json(
        { 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          fields: missingFields
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      authLogger.warn('Signup failed: invalid email format', {
        email,
        duration: Date.now() - startTime
      });
      return NextResponse.json(
        { error: 'Please provide a valid email address' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      authLogger.warn('Signup failed: weak password', {
        email: email.toLowerCase(),
        errors: passwordValidation.errors,
        duration: Date.now() - startTime
      });
      return NextResponse.json(
        { 
          error: 'Password does not meet security requirements',
          details: passwordValidation.errors 
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Validate invitation token
    const invitation = await invitationRepository.findValidByToken(token);
    if (!invitation) {
      authLogger.warn('Signup failed: invalid token', {
        email: email.toLowerCase(),
        token: token.substring(0, 8) + '...',
        duration: Date.now() - startTime
      });
      return NextResponse.json(
        { 
          error: 'Invalid or expired invitation token. Please request a new invitation.',
          code: 'INVALID_TOKEN'
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // Check if email matches invitation
    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
      authLogger.warn('Signup failed: email mismatch', {
        providedEmail: email.toLowerCase(),
        invitationEmail: invitation.email.toLowerCase(),
        duration: Date.now() - startTime
      });
      return NextResponse.json(
        { 
          error: `This invitation is for ${invitation.email}. Please use the correct email address or request a new invitation.`,
          code: 'EMAIL_MISMATCH'
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      authLogger.warn('Signup failed: user exists', {
        email: email.toLowerCase(),
        duration: Date.now() - startTime
      });
      return NextResponse.json(
        { 
          error: 'An account already exists with this email address. Please sign in instead.',
          code: 'USER_EXISTS'
        } as ApiResponse<never>,
        { status: 409 }
      );
    }

    // Create user
    authLogger.info('Creating new user', {
      email: email.toLowerCase(),
      invitedBy: invitation.invitedBy,
      invitationId: invitation.id
    });
    
    const user = await userRepository.create({
      email,
      password,
      firstName,
      lastName,
      gradYear,
      degreeProgram,
      currentRole,
      linkedinUrl,
      personalSite,
      location,
      role: 'head_ta', // Default role for invited users
      invitedBy: invitation.invitedBy,
    });

    // Mark invitation as used
    await invitationRepository.markAsUsed(invitation.id);
    
    authLogger.info('Signup successful', {
      userId: user.id,
      email: user.email,
      invitedBy: invitation.invitedBy,
      duration: Date.now() - startTime
    });

    // Send welcome email if email service is configured
    if (isEmailConfigured()) {
      const emailResult = await sendWelcomeEmail({
        to: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        role: user.role as 'head_ta' | 'admin',
      });

      if (!emailResult.success) {
        authLogger.error('Failed to send welcome email', emailResult.error, {
          userId: user.id,
          email: user.email
        });
        // Don't fail the whole request if email fails, but log it
      } else {
        authLogger.info('Welcome email sent', {
          userId: user.id,
          email: user.email
        });
      }
    }

    // Return user data (without password)
    return NextResponse.json(
      { 
        data: user,
        message: 'Account created successfully. Please sign in.'
      } as ApiResponse<User>,
      { status: 201 }
    );
  } catch (error) {
    authLogger.error('Signup error', error, {
      email: email?.toLowerCase(),
      duration: Date.now() - startTime
    });
    return NextResponse.json(
      { error: 'Failed to create account' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}