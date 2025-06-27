import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { invitations, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { ApiResponse } from '@/lib/types';

interface InvitationRecord {
  id: string;
  email: string;
  invitedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
  status: 'pending' | 'accepted' | 'expired';
}

interface Params {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/users/[id]/invitation-history
 * Get invitation history for an unclaimed profile
 * Requires admin authentication
 */
export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id: profileId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    // Get the unclaimed profile
    const profile = await db
      .select({
        id: users.id,
        email: users.email,
        isUnclaimed: users.isUnclaimed,
      })
      .from(users)
      .where(eq(users.id, profileId))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    if (!profile[0].isUnclaimed) {
      return NextResponse.json(
        { error: 'Profile is not unclaimed' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Create alias for inviter user join
    const inviterUsers = db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
    }).from(users).as('inviterUsers');

    // Get all invitations for this email
    const invitationHistory = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        createdAt: invitations.createdAt,
        expiresAt: invitations.expiresAt,
        usedAt: invitations.usedAt,
        inviter: {
          id: inviterUsers.id,
          firstName: inviterUsers.firstName,
          lastName: inviterUsers.lastName,
        },
      })
      .from(invitations)
      .innerJoin(inviterUsers, eq(inviterUsers.id, invitations.invitedBy))
      .where(eq(invitations.email, profile[0].email))
      .orderBy(desc(invitations.createdAt));

    // Transform and add status
    const now = new Date();
    const records: InvitationRecord[] = invitationHistory.map(inv => ({
      id: inv.id,
      email: inv.email,
      invitedBy: {
        id: inv.inviter.id,
        firstName: inv.inviter.firstName,
        lastName: inv.inviter.lastName,
      },
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
      usedAt: inv.usedAt,
      status: inv.usedAt 
        ? 'accepted' as const
        : inv.expiresAt > now 
          ? 'pending' as const
          : 'expired' as const,
    }));

    return NextResponse.json(
      { 
        data: records,
        total: records.length 
      } as ApiResponse<InvitationRecord[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching invitation history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation history' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}