import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { professorRepository } from '@/lib/repositories/professors';
import { userRepository } from '@/lib/repositories/users';
import type { ApiResponse, Professor, CreateProfessorInput } from '@/lib/types';

/**
 * GET /api/professors
 * Get all professors
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const includeCourseCount = searchParams.get('includeCourseCount') === 'true';

    let professors: Professor[] | (Professor & { courseCount: number })[];

    if (search) {
      professors = await professorRepository.search(search);
    } else if (includeCourseCount) {
      professors = await professorRepository.findAllWithCourseCount();
    } else {
      professors = await professorRepository.findAll();
    }

    return NextResponse.json(
      { data: professors } as ApiResponse<Professor[] | (Professor & { courseCount: number })[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching professors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch professors' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/professors
 * Create a new professor (admin only)
 */
export async function POST(request: NextRequest) {
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
    
    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const professorInput: CreateProfessorInput = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
    };

    // Create professor
    const professor = await professorRepository.create(professorInput);

    return NextResponse.json(
      { data: professor, message: 'Professor created successfully' } as ApiResponse<Professor>,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating professor:', error);
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'Professor with this email already exists' } as ApiResponse<never>,
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create professor' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}