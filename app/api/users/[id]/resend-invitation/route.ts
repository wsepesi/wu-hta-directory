import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userRepository } from '@/lib/repositories/users';
import { db } from '@/lib/db';
import { invitations } from '@/lib/db/schema';
import { eq, and, gte, isNull } from 'drizzle-orm';
import { sendClaimProfileInvitation } from '@/lib/invitation-logic';
import type { ApiResponse } from '@/lib/types';
import type { InvitationResult } from '@/lib/invitation-logic';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/users/[id]/resend-invitation
 * Resend invitation to an unclaimed profile
 * Requires admin authentication
 */
export async function POST(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id: unclaimedUserId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    // Get the unclaimed profile
    const unclaimedProfile = await userRepository.findById(unclaimedUserId);
    
    if (!unclaimedProfile) {
      return NextResponse.json(
        { error: 'Profile not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    if (!unclaimedProfile.isUnclaimed) {
      return NextResponse.json(
        { error: 'Profile is already claimed' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Check for existing active invitation
    const existingInvitation = await db
      .select({ id: invitations.id })
      .from(invitations)
      .where(
        and(
          eq(invitations.email, unclaimedProfile.email),
          gte(invitations.expiresAt, new Date()),
          isNull(invitations.usedAt)
        )
      )
      .limit(1);

    if (existingInvitation.length > 0) {
      return NextResponse.json(
        { error: 'An active invitation already exists for this profile' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Send new invitation
    const result = await sendClaimProfileInvitation({
      unclaimedUserId,
      invitedBy: session.user.id,
      recipientEmail: unclaimedProfile.email,
      recipientName: `${unclaimedProfile.firstName} ${unclaimedProfile.lastName}`,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send invitation' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: {
        success: true,
        invitation: result.invitation,
      },
      message: 'Invitation sent successfully'
    } as ApiResponse<{ success: boolean; invitation: NonNullable<InvitationResult['invitation']> }>);
  } catch (error) {
    console.error('Error resending invitation:', error);
    return NextResponse.json(
      { error: 'Failed to resend invitation' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}