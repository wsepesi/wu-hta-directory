import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { taAssignmentRepository } from '@/lib/repositories/hta-records';
import { userRepository } from '@/lib/repositories/users';
import type { ApiResponse, TAAssignment, TAAssignmentWithRelations } from '@/lib/types';
import { notificationService } from '@/lib/notification-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/hta-records/[id]
 * Get a specific HTA record by ID
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

    let assignment: TAAssignment | TAAssignmentWithRelations | null;
    if (includeRelations) {
      assignment = await taAssignmentRepository.findWithRelations(id);
    } else {
      assignment = await taAssignmentRepository.findById(id);
    }

    if (!assignment) {
      return NextResponse.json(
        { error: 'TA assignment not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // Check permissions: users can only view their own assignments unless admin
    const currentUser = await userRepository.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    if (currentUser.role !== 'admin' && assignment.userId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot view this assignment' } as ApiResponse<never>,
        { status: 403 }
      );
    }

    return NextResponse.json(
      { data: assignment } as ApiResponse<TAAssignment | TAAssignmentWithRelations>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching TA assignment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TA assignment' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ta-assignments/[id]
 * Update a TA assignment (admin or assignment owner)
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

    // Get the assignment to check ownership
    const assignment = await taAssignmentRepository.findById(id);
    if (!assignment) {
      return NextResponse.json(
        { error: 'TA assignment not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // Check permissions
    const currentUser = await userRepository.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    if (currentUser.role !== 'admin' && assignment.userId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot update this assignment' } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Remove fields that shouldn't be updated
    delete body.id;
    delete body.userId;
    delete body.courseOfferingId;
    delete body.createdAt;

    // Update TA assignment
    const updatedAssignment = await taAssignmentRepository.update(id, body);

    return NextResponse.json(
      { data: updatedAssignment, message: 'TA assignment updated successfully' } as ApiResponse<TAAssignment>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating TA assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update TA assignment' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ta-assignments/[id]
 * Delete a TA assignment (admin or assignment owner)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Get the assignment to check ownership
    const assignment = await taAssignmentRepository.findById(id);
    if (!assignment) {
      return NextResponse.json(
        { error: 'TA assignment not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // Check permissions
    const currentUser = await userRepository.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    if (currentUser.role !== 'admin' && assignment.userId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot delete this assignment' } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Delete TA assignment
    const deleted = await taAssignmentRepository.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete TA assignment' } as ApiResponse<never>,
        { status: 500 }
      );
    }

    // Send notification to the TA about removal
    await notificationService.notifyTARemoval({
      taId: assignment.userId,
      courseOfferingId: assignment.courseOfferingId,
      removedBy: currentUser.id,
    });

    return NextResponse.json(
      { message: 'TA assignment deleted successfully' } as ApiResponse<never>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting TA assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete TA assignment' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}