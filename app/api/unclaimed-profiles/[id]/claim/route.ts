import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { userRepository } from '@/lib/repositories/users';
import { logAuditEvent } from '@/lib/audit-logger';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id: unclaimedId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Claim the profile
    await userRepository.claimProfile(unclaimedId, currentUser.id);

    // Log the action
    await logAuditEvent({
      userId: currentUser.id,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: unclaimedId,
      metadata: {
        claimedBy: currentUser.id,
        claimedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile claimed successfully',
    });
  } catch (error) {
    console.error('Error claiming profile:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('already claimed')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to claim profile' },
      { status: 500 }
    );
  }
}