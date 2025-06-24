import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { professorRepository } from '@/lib/repositories/professors';
import { userRepository } from '@/lib/repositories/users';
import type { ApiResponse, Professor } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/professors/[id]
 * Get a specific professor by ID
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

    // Check if requesting detailed info (with course offerings)
    const searchParams = request.nextUrl.searchParams;
    const includeCourseOfferings = searchParams.get('include') === 'courseOfferings';

    let professor: Professor | (Professor & { courseOfferings: any[] }) | null;
    if (includeCourseOfferings) {
      professor = await professorRepository.findWithCourseOfferings(id);
    } else {
      professor = await professorRepository.findById(id);
    }

    if (!professor) {
      return NextResponse.json(
        { error: 'Professor not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { data: professor } as ApiResponse<Professor | (Professor & { courseOfferings: any[] })>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching professor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch professor' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/professors/[id]
 * Update a professor (admin only)
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

    // Validate email format if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' } as ApiResponse<never>,
          { status: 400 }
        );
      }
    }

    // Update professor
    const updatedProfessor = await professorRepository.update(id, body);

    return NextResponse.json(
      { data: updatedProfessor, message: 'Professor updated successfully' } as ApiResponse<Professor>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating professor:', error);
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'Professor with this email already exists' } as ApiResponse<never>,
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update professor' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/professors/[id]
 * Delete a professor (admin only)
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

    // Delete professor
    const deleted = await professorRepository.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Professor not found' } as ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Professor deleted successfully' } as ApiResponse<never>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting professor:', error);
    return NextResponse.json(
      { error: 'Failed to delete professor. Make sure no course offerings are assigned to this professor.' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}