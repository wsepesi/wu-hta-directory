import { NextRequest, NextResponse } from 'next/server';
import { invitationRepository } from '@/lib/repositories/invitations';
import { userRepository } from '@/lib/repositories/users';
import { sendWelcomeEmail, isEmailConfigured } from '@/lib/email-service';
import { validatePassword } from '@/lib/password-utils';
import { authLogger } from '@/lib/logger';

/**
 * POST /api/auth/signup-action
 * Server-side form action for progressive enhancement
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse form data
    const formData = await request.formData();
    
    // Extract all fields
    const data = {
      token: formData.get('token') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      gradYear: formData.get('gradYear') as string,
      degreeProgram: formData.get('degreeProgram') as string,
      currentRole: formData.get('currentRole') as string,
      location: formData.get('location') as string,
      linkedinUrl: formData.get('linkedinUrl') as string,
      personalSite: formData.get('personalSite') as string,
    };
    
    const isNoJS = formData.get('_no_js') === 'true';

    authLogger.info('Signup attempt (form action)', {
      email: data.email?.toLowerCase(),
      hasToken: !!data.token,
      isNoJS,
      firstName: data.firstName,
      lastName: data.lastName
    });

    // Build the registration URL with params for error handling
    const buildErrorUrl = (error: string, code?: string) => {
      const url = new URL('/auth/register', request.url);
      url.searchParams.set('error', error);
      if (code) url.searchParams.set('code', code);
      if (data.token) url.searchParams.set('token', data.token);
      // Preserve form data
      Object.entries(data).forEach(([key, value]) => {
        if (value && key !== 'password' && key !== 'confirmPassword' && key !== 'token') {
          url.searchParams.set(key, value);
        }
      });
      return url;
    };

    // Validate required fields
    const missingFields = [];
    if (!data.token) missingFields.push('invitation token');
    if (!data.email) missingFields.push('email');
    if (!data.password) missingFields.push('password');
    if (!data.firstName) missingFields.push('first name');
    if (!data.lastName) missingFields.push('last name');
    
    if (missingFields.length > 0) {
      return NextResponse.redirect(
        buildErrorUrl(`Missing required fields: ${missingFields.join(', ')}`, 'missing_fields')
      );
    }

    // Validate passwords match
    if (data.password !== data.confirmPassword) {
      return NextResponse.redirect(
        buildErrorUrl('Passwords do not match', 'password_mismatch')
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.redirect(
        buildErrorUrl('Please provide a valid email address', 'invalid_email')
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      return NextResponse.redirect(
        buildErrorUrl(
          `Password does not meet requirements: ${passwordValidation.errors.join(', ')}`,
          'weak_password'
        )
      );
    }

    // Validate invitation token
    const invitation = await invitationRepository.findValidByToken(data.token);
    if (!invitation) {
      return NextResponse.redirect(
        buildErrorUrl('Invalid or expired invitation token', 'invalid_token')
      );
    }

    // Check if email matches invitation
    if (invitation.email.toLowerCase() !== data.email.toLowerCase()) {
      return NextResponse.redirect(
        buildErrorUrl(
          `This invitation is for ${invitation.email}. Please use the correct email address.`,
          'email_mismatch'
        )
      );
    }

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      return NextResponse.redirect(
        buildErrorUrl('An account already exists with this email address', 'user_exists')
      );
    }

    // Create user
    authLogger.info('Creating new user (form action)', {
      email: data.email.toLowerCase(),
      invitedBy: invitation.invitedBy,
      invitationId: invitation.id
    });
    
    const user = await userRepository.create({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      gradYear: data.gradYear ? parseInt(data.gradYear) : undefined,
      degreeProgram: data.degreeProgram || undefined,
      currentRole: data.currentRole || undefined,
      linkedinUrl: data.linkedinUrl || undefined,
      personalSite: data.personalSite || undefined,
      location: data.location || undefined,
      role: 'head_ta',
      invitedBy: invitation.invitedBy,
    });

    // Mark invitation as used
    await invitationRepository.markAsUsed(invitation.id);
    
    authLogger.info('Signup successful (form action)', {
      userId: user.id,
      email: user.email,
      invitedBy: invitation.invitedBy,
      duration: Date.now() - startTime
    });

    // Send welcome email if configured
    if (isEmailConfigured()) {
      await sendWelcomeEmail({
        to: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        role: user.role as 'head_ta' | 'admin',
      }).catch(error => {
        authLogger.error('Failed to send welcome email', error, {
          userId: user.id,
          email: user.email
        });
      });
    }

    // Redirect to sign in page with success message
    const successUrl = new URL('/auth/signin', request.url);
    successUrl.searchParams.set('success', 'account_created');
    successUrl.searchParams.set('email', data.email);
    return NextResponse.redirect(successUrl);
    
  } catch (error) {
    authLogger.error('Signup action error', error, {
      duration: Date.now() - startTime
    });
    
    const url = new URL('/auth/register', request.url);
    url.searchParams.set('error', 'server_error');
    return NextResponse.redirect(url);
  }
}