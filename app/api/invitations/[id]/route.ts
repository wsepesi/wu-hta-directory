import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { invitationRepository } from '@/lib/repositories/invitations';
import { userRepository } from '@/lib/repositories/users';
import type { ApiResponse, Invitation, InvitationWithRelations } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/invitations/[id]
 * Get a specific invitation by ID (admin only)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const currentUser = await userRepository.findById(session.user.id);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' } as ApiResponse<never>,
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if requesting detailed info (with inviter)
    const searchParams = request.nextUrl.searchParams;
    const includeInviter = searchParams.get('include') === 'inviter';

    let invitation: Invitation | InvitationWithRelations | null;
    if (includeInviter) {
      invitation = await invitationRepository.findWithRelations(id);
    } else {
      invitation = await invitationRepository.findById(id);
    }

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { data: invitation } as ApiResponse<Invitation | InvitationWithRelations>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/invitations/[id]
 * Update an invitation (admin only) - for extending expiration or regenerating token
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const currentUser = await userRepository.findById(session.user.id);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' } as ApiResponse<never>,
        { status: 403 }
      );
    }

    const { id } = await params;

    // Parse request body
    const body = await request.json();
    const action = body.action; // extend, regenerate

    let updatedInvitation: Invitation;

    if (action === 'extend') {
      const days = body.days || 7;
      updatedInvitation = await invitationRepository.extendExpiration(id, days);
    } else if (action === 'regenerate') {
      updatedInvitation = await invitationRepository.regenerateToken(id);
      // TODO: Send new invitation email
      // await sendInvitationEmail(updatedInvitation.email, updatedInvitation.token);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "extend" or "regenerate"' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    return NextResponse.json(
      { data: updatedInvitation, message: `Invitation ${action}ed successfully` } as ApiResponse<Invitation>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to update invitation' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invitations/[id]
 * Delete an invitation (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const currentUser = await userRepository.findById(session.user.id);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' } as ApiResponse<never>,
        { status: 403 }
      );
    }

    const { id } = await params;

    // Delete invitation
    const deleted = await invitationRepository.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Invitation not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Invitation deleted successfully' } as ApiResponse<never>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to delete invitation' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}