import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userRepository } from '@/lib/repositories/users';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { ApiResponse, InvitationTree, User } from '@/lib/types';

interface InvitationTreeWithStats {
  user: User;
  invitees: InvitationTreeWithStats[];
  stats: {
    totalDescendants: number;
    maxDepth: number;
  };
}

/**
 * Build invitation tree recursively with stats
 */
async function buildInvitationTree(userId: string): Promise<InvitationTreeWithStats> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Find all users invited by this user
  const invitees = await db.select()
    .from(users)
    .where(eq(users.invitedBy, userId))
    .orderBy(users.createdAt);

  // Recursively build tree for each invitee
  const inviteeTree = await Promise.all(
    invitees.map(invitee => buildInvitationTree(invitee.id))
  );

  // Calculate stats
  const totalDescendants = inviteeTree.reduce(
    (sum, child) => sum + 1 + child.stats.totalDescendants,
    0
  );
  const maxDepth = inviteeTree.length > 0
    ? Math.max(...inviteeTree.map(child => child.stats.maxDepth)) + 1
    : 0;

  return {
    user: user as User,
    invitees: inviteeTree,
    stats: {
      totalDescendants,
      maxDepth,
    },
  };
}

/**
 * GET /api/admin/invitation-tree
 * Get the invitation tree showing who invited whom (admin only)
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const rootUserId = searchParams.get('rootUserId');

    let trees: InvitationTreeWithStats[];

    if (rootUserId) {
      // Build tree from specific user
      const tree = await buildInvitationTree(rootUserId);
      trees = [tree];
    } else {
      // Find all root users (those who weren't invited by anyone)
      const rootUsers = await db.select()
        .from(users)
        .where(eq(users.invitedBy, null))
        .orderBy(users.createdAt);

      // Build tree for each root user
      trees = await Promise.all(
        rootUsers.map(user => buildInvitationTree(user.id))
      );
    }

    return NextResponse.json({ trees }, { status: 200 });
  } catch (error) {
    console.error('Error fetching invitation tree:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation tree' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}