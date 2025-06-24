import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { courseOfferingRepository } from '@/lib/repositories/course-offerings';
import { userRepository } from '@/lib/repositories/users';
import type { ApiResponse, CourseOffering, CourseOfferingWithRelations, CreateCourseOfferingInput } from '@/lib/types';

/**
 * GET /api/course-offerings
 * Get all course offerings with optional filters
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
    const semester = searchParams.get('semester');
    const courseId = searchParams.get('courseId');
    const professorId = searchParams.get('professorId');
    const year = searchParams.get('year');
    const season = searchParams.get('season');
    const includeRelations = searchParams.get('include') === 'relations';

    let courseOfferings: CourseOffering[] | CourseOfferingWithRelations[];

    // Apply filters based on query parameters
    if (semester && includeRelations) {
      courseOfferings = await courseOfferingRepository.findBySemesterWithRelations(semester);
    } else if (semester) {
      courseOfferings = await courseOfferingRepository.findBySemester(semester);
    } else if (courseId) {
      courseOfferings = await courseOfferingRepository.findByCourseId(courseId);
    } else if (professorId) {
      courseOfferings = await courseOfferingRepository.findByProfessorId(professorId);
    } else if (year && season && ['Fall', 'Spring'].includes(season)) {
      courseOfferings = await courseOfferingRepository.findByYearAndSeason(
        parseInt(year),
        season as 'Fall' | 'Spring'
      );
    } else {
      courseOfferings = await courseOfferingRepository.findAll();
    }

    return NextResponse.json(
      { data: courseOfferings } as ApiResponse<CourseOffering[] | CourseOfferingWithRelations[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching course offerings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course offerings' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/course-offerings
 * Create a new course offering (admin only)
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
    if (!body.courseId || !body.semester || !body.year || !body.season) {
      return NextResponse.json(
        { error: 'Missing required fields' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Validate season
    if (!['Fall', 'Spring'].includes(body.season)) {
      return NextResponse.json(
        { error: 'Invalid season. Must be Fall or Spring' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Check if offering already exists
    const exists = await courseOfferingRepository.exists(
      body.courseId,
      body.year,
      body.season
    );

    if (exists) {
      return NextResponse.json(
        { error: 'Course offering already exists for this course, year, and season' } as ApiResponse<never>,
        { status: 409 }
      );
    }

    const courseOfferingInput: CreateCourseOfferingInput = {
      courseId: body.courseId,
      professorId: body.professorId,
      semester: body.semester,
      year: body.year,
      season: body.season,
    };

    // Create course offering
    const courseOffering = await courseOfferingRepository.create(courseOfferingInput);

    return NextResponse.json(
      { data: courseOffering, message: 'Course offering created successfully' } as ApiResponse<CourseOffering>,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating course offering:', error);
    return NextResponse.json(
      { error: 'Failed to create course offering' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}