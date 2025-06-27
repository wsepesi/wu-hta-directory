import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { courseOfferingRepository } from '@/lib/repositories/course-offerings';
import { userRepository } from '@/lib/repositories/users';
import type { ApiResponse, CourseOffering, CourseOfferingWithRelations } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/course-offerings/[id]
 * Get a specific course offering by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Public endpoint - no authentication required for GET

    const { id } = await params;

    // Check if requesting detailed info (with relations)
    const searchParams = request.nextUrl.searchParams;
    const includeRelations = searchParams.get('include') === 'relations';

    let courseOffering: CourseOffering | CourseOfferingWithRelations | null;
    if (includeRelations) {
      courseOffering = await courseOfferingRepository.findWithRelations(id);
    } else {
      courseOffering = await courseOfferingRepository.findById(id);
    }

    if (!courseOffering) {
      return NextResponse.json(
        { error: 'Course offering not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { data: courseOffering } as ApiResponse<CourseOffering | CourseOfferingWithRelations>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching course offering:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course offering' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/course-offerings/[id]
 * Update a course offering (admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Parse request body
    const body = await request.json();

    // Remove fields that shouldn't be updated
    delete body.id;
    delete body.createdAt;

    // Validate season if provided
    if (body.season && !['Fall', 'Spring'].includes(body.season)) {
      return NextResponse.json(
        { error: 'Invalid season. Must be Fall or Spring' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Add updatedBy field
    body.updatedBy = session.user.id;

    // Update course offering
    const updatedCourseOffering = await courseOfferingRepository.update(id, body);

    return NextResponse.json(
      { data: updatedCourseOffering, message: 'Course offering updated successfully' } as ApiResponse<CourseOffering>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating course offering:', error);
    return NextResponse.json(
      { error: 'Failed to update course offering' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/course-offerings/[id]
 * Delete a course offering (admin only)
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

    // Delete course offering
    const deleted = await courseOfferingRepository.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Course offering not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Course offering deleted successfully' } as ApiResponse<never>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting course offering:', error);
    return NextResponse.json(
      { error: 'Failed to delete course offering. Make sure no TA assignments exist for this offering.' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}