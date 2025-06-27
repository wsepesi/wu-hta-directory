import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendBulkClaimInvitations } from '@/lib/invitation-logic';
import { z } from 'zod';
import type { ApiResponse } from '@/lib/types';

const bulkInvitationSchema = z.object({
  profileIds: z.array(z.string().uuid()).min(1),
  personalMessage: z.string().optional(),
});

interface BulkInvitationResult {
  sent: number;
  failed: number;
  errors: Array<{
    profileId: string;
    error: string;
  }>;
}

/**
 * POST /api/users/unclaimed/send-bulk-invitations
 * Send invitations to multiple unclaimed profiles
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = bulkInvitationSchema.parse(body);

    // Send bulk invitations
    const result = await sendBulkClaimInvitations({
      profileIds: validatedData.profileIds,
      invitedBy: session.user.id,
      personalMessage: validatedData.personalMessage,
    });

    return NextResponse.json(
      { 
        data: result,
        message: `Successfully sent ${result.sent} invitations${result.failed > 0 ? `, ${result.failed} failed` : ''}`
      } as ApiResponse<BulkInvitationResult>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending bulk invitations:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors } as ApiResponse<never>,
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to send bulk invitations' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}