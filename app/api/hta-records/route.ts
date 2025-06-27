import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { taAssignmentRepository } from '@/lib/repositories/hta-records';
import { userRepository } from '@/lib/repositories/users';
import type { ApiResponse, TAAssignment, TAAssignmentWithRelations, CreateTAAssignmentInput, TAAssignmentFilters } from '@/lib/types';
import { notificationService } from '@/lib/notification-service';

/**
 * GET /api/hta-records
 * Get all Head TA records with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    // Parse query parameters for filters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const courseOfferingId = searchParams.get('courseOfferingId');
    const semester = searchParams.get('semester');
    const includeRelations = searchParams.get('include') === 'relations';

    // For non-admin users, only show their own assignments unless specifically filtering
    const currentUser = await userRepository.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    let assignments: TAAssignment[] | TAAssignmentWithRelations[];

    // Apply filters based on query parameters
    if (semester) {
      // Semester filter requires relations to filter by course offering semester
      assignments = await taAssignmentRepository.findBySemester(semester);
    } else if (userId && includeRelations) {
      assignments = await taAssignmentRepository.findByUserIdWithRelations(userId);
    } else if (userId) {
      assignments = await taAssignmentRepository.findByUserId(userId);
    } else if (courseOfferingId) {
      assignments = await taAssignmentRepository.findByCourseOfferingId(courseOfferingId);
    } else {
      // If not admin and no specific filters, only show user's own assignments
      const filters: TAAssignmentFilters = {};
      if (currentUser.role !== 'admin') {
        filters.userId = currentUser.id;
      }
      assignments = await taAssignmentRepository.findAll(filters);
    }

    return NextResponse.json(
      { data: assignments } as ApiResponse<TAAssignment[] | TAAssignmentWithRelations[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching TA assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TA assignments' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/ta-assignments
 * Create a new TA assignment (admin only or self)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const currentUser = await userRepository.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.userId || !body.courseOfferingId) {
      return NextResponse.json(
        { error: 'Missing required fields' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Check permissions: users can only create assignments for themselves, admin can create for anyone
    if (currentUser.role !== 'admin' && body.userId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Forbidden: Can only create assignments for yourself' } as ApiResponse<never>,
        { status: 403 }
      );
    }

    const taAssignmentInput: CreateTAAssignmentInput = {
      userId: body.userId,
      courseOfferingId: body.courseOfferingId,
      hoursPerWeek: body.hoursPerWeek,
      responsibilities: body.responsibilities,
      autoInvite: body.autoInvite,
    };

    // Create HTA record
    const assignment = await taAssignmentRepository.create(taAssignmentInput);

    // Only send notification if autoInvite is true (default to true for backwards compatibility)
    const shouldInvite = body.autoInvite !== false;
    if (shouldInvite) {
      await notificationService.notifyTAAssignment({
        taId: taAssignmentInput.userId,
        courseOfferingId: taAssignmentInput.courseOfferingId,
        hoursPerWeek: taAssignmentInput.hoursPerWeek || 10,
        assignedBy: currentUser.id,
      });
    }

    return NextResponse.json(
      { data: assignment, message: shouldInvite ? 'HTA recorded successfully and invitation sent' : 'HTA recorded successfully' } as ApiResponse<TAAssignment>,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating HTA record:', error);
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'HTA record already exists for this user and course offering' } as ApiResponse<never>,
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create TA assignment' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}