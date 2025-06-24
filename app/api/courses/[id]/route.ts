import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { courseRepository } from '@/lib/repositories/courses';
import { userRepository } from '@/lib/repositories/users';
import type { ApiResponse, Course, CourseWithRelations } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/courses/[id]
 * Get a specific course by ID
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

    let course: Course | CourseWithRelations | null;
    if (includeRelations) {
      course = await courseRepository.findWithRelations(id);
    } else {
      course = await courseRepository.findById(id);
    }

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { data: course } as ApiResponse<Course | CourseWithRelations>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/courses/[id]
 * Update a course (admin only)
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

    // Validate offering pattern if provided
    if (body.offeringPattern && !['both', 'fall_only', 'spring_only', 'sparse'].includes(body.offeringPattern)) {
      return NextResponse.json(
        { error: 'Invalid offering pattern' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Update course
    const updatedCourse = await courseRepository.update(id, body);

    return NextResponse.json(
      { data: updatedCourse, message: 'Course updated successfully' } as ApiResponse<Course>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating course:', error);
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'Course with this number already exists' } as ApiResponse<never>,
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update course' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/courses/[id]
 * Delete a course (admin only)
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

    // Delete course
    const deleted = await courseRepository.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Course not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Course deleted successfully' } as ApiResponse<never>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course. Make sure no course offerings exist for this course.' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}