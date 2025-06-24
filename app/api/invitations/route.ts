import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { invitationRepository } from '@/lib/repositories/invitations';
import { userRepository } from '@/lib/repositories/users';
import { sendInvitationEmail, isEmailConfigured } from '@/lib/email-service';
import type { ApiResponse, Invitation, InvitationWithRelations, CreateInvitationInput } from '@/lib/types';

/**
 * GET /api/invitations
 * Get all invitations (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const currentUser = await userRepository.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const includeExpired = searchParams.get('includeExpired') === 'true';
    const status = searchParams.get('status'); // pending, expired, used
    const inviterId = searchParams.get('inviterId');
    const includeInviter = searchParams.get('include') === 'inviter';

    let invitations: Invitation[] | InvitationWithRelations[];

    // Non-admin users can only see their own invitations
    if (currentUser.role !== 'admin') {
      invitations = await invitationRepository.findByInviter(session.user.id);
    } else {
      // Admin users can see all invitations based on filters
      if (inviterId) {
        invitations = await invitationRepository.findByInviter(inviterId);
      } else if (status === 'pending') {
        invitations = await invitationRepository.findPending();
      } else if (status === 'expired') {
        invitations = await invitationRepository.findExpired();
      } else if (includeInviter) {
        invitations = await invitationRepository.findAllWithInviter();
      } else {
        invitations = await invitationRepository.findAll(includeExpired);
      }
    }

    return NextResponse.json(
      { data: invitations } as ApiResponse<Invitation[] | InvitationWithRelations[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/invitations
 * Create a new invitation
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Check if user already exists with this email
    const existingUser = await userRepository.findByEmail(body.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' } as ApiResponse<never>,
        { status: 409 }
      );
    }

    const invitationInput: CreateInvitationInput = {
      email: body.email,
      invitedBy: session.user.id,
      suggestedCourseId: body.suggestedCourseId,
      courseOfferingId: body.courseOfferingId,
      targetedForTA: body.targetedForTA || false,
      message: body.message,
    };

    // Create invitation
    const invitation = await invitationRepository.create(invitationInput);

    // Get inviter details for the email
    const inviter = await userRepository.findById(session.user.id);
    if (!inviter) {
      return NextResponse.json(
        { error: 'Inviter not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // Send invitation email if email service is configured
    if (isEmailConfigured()) {
      let emailResult;
      
      if (body.targetedForTA && body.courseOfferingId) {
        // Send targeted TA invitation
        emailResult = await sendInvitationEmail({
          to: invitation.email,
          inviterName: `${inviter.firstName} ${inviter.lastName}`,
          invitationToken: invitation.token,
          role: 'head_ta',
          expirationDays: 7,
          targetedForTA: true,
          courseOfferingId: body.courseOfferingId,
          personalMessage: body.message,
        });
      } else {
        // Send regular invitation
        emailResult = await sendInvitationEmail({
          to: invitation.email,
          inviterName: `${inviter.firstName} ${inviter.lastName}`,
          invitationToken: invitation.token,
          role: 'head_ta',
          expirationDays: 7,
          personalMessage: body.message,
        });
      }

      if (!emailResult.success) {
        console.error('Failed to send invitation email:', emailResult.error);
        // Don't fail the whole request if email fails, but log it
      }
    } else {
      console.warn('Email service not configured. Invitation created but email not sent.');
    }

    // Generate the invitation link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/auth/register?token=${invitation.token}`;

    return NextResponse.json(
      { 
        data: invitation,
        inviteLink,
        message: isEmailConfigured() 
          ? 'Invitation created and email sent successfully' 
          : 'Invitation created successfully (email service not configured)'
      } as ApiResponse<Invitation> & { inviteLink: string },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating invitation:', error);
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'Pending invitation already exists for this email' } as ApiResponse<never>,
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create invitation' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}