import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userRepository } from '@/lib/repositories/users';
import { db } from '@/lib/db';
import { users, taAssignments, invitations } from '@/lib/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import type { ApiResponse, UserWithInviter } from '@/lib/types';

/**
 * GET /api/admin/users
 * Get all users with additional admin information (admin only)
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

    // Get all users with inviter information
    const usersWithInviter = await db.query.users.findMany({
      with: {
        inviter: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [desc(users.createdAt)],
    });

    // Get additional statistics for each user
    const usersWithStats = await Promise.all(
      usersWithInviter.map(async (user) => {
        // Count TA assignments
        const assignmentCount = await taAssignmentRepository.countByUser(user.id);
        
        // Count invitations sent
        const invitationsSent = await invitationRepository.countByInviter(user.id);
        
        // Count users invited
        const usersInvited = await db.select({ count: users.id })
          .from(users)
          .where(eq(users.invitedBy, user.id));

        return {
          ...user,
          stats: {
            assignmentCount,
            invitationsSent,
            usersInvited: usersInvited.length,
          },
        };
      })
    );

    return NextResponse.json(
      { data: usersWithStats } as ApiResponse<typeof usersWithStats>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users/[id]/role
 * Update a user's role (admin only)
 */
export async function PUT(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and role' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    if (!['head_ta', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "head_ta" or "admin"' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Prevent admin from changing their own role
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Update user role
    const updatedUser = await userRepository.update(userId, { role });

    return NextResponse.json(
      { data: updatedUser, message: 'User role updated successfully' } as ApiResponse<typeof updatedUser>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}