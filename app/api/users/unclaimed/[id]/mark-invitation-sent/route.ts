import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userRepository } from '@/lib/repositories/users';
import type { ApiResponse } from '@/lib/types';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/users/unclaimed/[id]/mark-invitation-sent
 * Mark an unclaimed profile as having an invitation sent
 * Requires admin authentication
 */
export async function POST(
  _request: NextRequest,
  { params }: Params
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify the profile exists and is unclaimed
    const profile = await userRepository.findById(id);
    if (!profile || !profile.isUnclaimed) {
      return NextResponse.json(
        { error: 'Unclaimed profile not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // Mark invitation as sent
    await userRepository.markInvitationSent(id);

    return NextResponse.json(
      { 
        data: { success: true },
        message: 'Invitation marked as sent' 
      } as ApiResponse<{ success: boolean }>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking invitation sent:', error);
    return NextResponse.json(
      { error: 'Failed to mark invitation sent' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}