import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userRepository } from '@/lib/repositories/users';
import type { ApiResponse, User, UserWithRelations } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/users/[id]
 * Get a specific user by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if requesting detailed info (with relations)
    const searchParams = request.nextUrl.searchParams;
    const includeRelations = searchParams.get('include') === 'relations';

    let user: User | UserWithRelations | null;
    if (includeRelations) {
      user = await userRepository.findWithRelations(id);
    } else {
      user = await userRepository.findById(id);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { data: user } as ApiResponse<User | UserWithRelations>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id]
 * Update a user (self or admin)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check permissions: user can update self, admin can update anyone
    const currentUser = await userRepository.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    const canUpdate = currentUser.id === id || currentUser.role === 'admin';
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot update this user' } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Remove fields that shouldn't be updated directly
    delete body.id;
    delete body.email; // Email changes should be handled separately
    delete body.passwordHash;
    delete body.createdAt;
    delete body.updatedAt;

    // Only admin can change roles
    if (currentUser.role !== 'admin') {
      delete body.role;
      delete body.invitedBy;
    }

    // Update user
    const updatedUser = await userRepository.update(id, body);

    return NextResponse.json(
      { data: updatedUser, message: 'User updated successfully' } as ApiResponse<User>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Delete a user (admin only)
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

    // Prevent admin from deleting themselves
    if (currentUser.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Get user info before deletion for audit log
    const userToDelete = await userRepository.findById(id);
    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // Delete user
    const deleted = await userRepository.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete user' } as ApiResponse<never>,
        { status: 500 }
      );
    }

    // Log the deletion
    const { logAuditEvent } = await import('@/lib/audit-logger');
    await logAuditEvent({
      userId: session.user.id,
      action: "USER_DELETED",
      entityType: "user",
      entityId: id,
      metadata: {
        deletedUserName: `${userToDelete.firstName} ${userToDelete.lastName}`,
        deletedUserEmail: userToDelete.email,
        deletedUserRole: userToDelete.role,
      }
    });

    return NextResponse.json(
      { message: 'User deleted successfully' } as ApiResponse<never>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}