import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userRepository } from '@/lib/repositories/users';
import { sendClaimProfileInvitation } from '@/lib/email-service';
import { logAuditEvent } from '@/lib/audit-logger';
import { logError } from '@/lib/error-logger';
import type { UpdateUserInput } from '@/lib/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Get the user
    const user = await userRepository.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is an unclaimed profile
    if (!user.isUnclaimed) {
      return NextResponse.json({ error: 'User is not an unclaimed profile' }, { status: 400 });
    }

    // Check if invitation was already sent recently (within 7 days)
    if (user.invitationSent) {
      const daysSinceLastInvitation = Math.floor(
        (Date.now() - new Date(user.invitationSent).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastInvitation < 7) {
        return NextResponse.json({ 
          error: `Invitation was already sent ${daysSinceLastInvitation} day(s) ago. Please wait ${7 - daysSinceLastInvitation} more day(s) before sending another.` 
        }, { status: 400 });
      }
    }

    // Generate a claim link
    const claimToken = crypto.randomUUID();
    const claimUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/profile/claim?token=${claimToken}&profileId=${id}`;

    // Send the invitation email
    await sendClaimProfileInvitation({
      to: user.email,
      profileName: `${user.firstName} ${user.lastName}`,
      claimUrl,
      senderName: `${session.user.firstName} ${session.user.lastName}`,
    });

    // Update the user record with invitation sent timestamp
    const invitationSentAt = new Date();
    await userRepository.update(id, {
      invitationSent: invitationSentAt,
    } as UpdateUserInput);

    // Log the action
    await logAuditEvent({
      userId: session.user.id,
      action: 'INVITATION_SENT',
      entityType: 'user',
      entityId: id,
      metadata: {
        recipientEmail: user.email,
        recipientName: `${user.firstName} ${user.lastName}`,
        invitationType: 'claim_profile',
      }
    });

    return NextResponse.json({ 
      success: true,
      invitationSentAt: new Date().toISOString(),
    });
  } catch (error) {
    await logError(error as Error, request);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}