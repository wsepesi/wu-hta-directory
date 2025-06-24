import { NextRequest, NextResponse } from 'next/server';
import { invitationRepository } from '@/lib/repositories/invitations';
import { userRepository } from '@/lib/repositories/users';
import { sendWelcomeEmail, isEmailConfigured } from '@/lib/email-service';
import { validatePassword } from '@/lib/password-utils';
import type { ApiResponse, User } from '@/lib/types';

/**
 * POST /api/auth/signup
 * Complete signup with invitation token
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { 
      token,
      email,
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

    // Validate required fields
    const missingFields = [];
    if (!token) missingFields.push('invitation token');
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');
    if (!firstName) missingFields.push('first name');
    if (!lastName) missingFields.push('last name');
    
    if (missingFields.length > 0) {
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
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
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
      return NextResponse.json(
        { 
          error: 'An account already exists with this email address. Please sign in instead.',
          code: 'USER_EXISTS'
        } as ApiResponse<never>,
        { status: 409 }
      );
    }

    // Create user
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

    // Send welcome email if email service is configured
    if (isEmailConfigured()) {
      const emailResult = await sendWelcomeEmail({
        to: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        role: user.role as 'head_ta' | 'admin',
      });

      if (!emailResult.success) {
        console.error('Failed to send welcome email:', emailResult.error);
        // Don't fail the whole request if email fails, but log it
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
    console.error('Error during signup:', error);
    return NextResponse.json(
      { error: 'Failed to create account' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}