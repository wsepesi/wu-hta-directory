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
    // Public endpoint - no authentication required for GET

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
  console.log('[COURSE_OFFERING_CREATE] Starting course offering creation process');
  
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    console.log('[COURSE_OFFERING_CREATE] Session check:', { 
      hasSession: !!session, 
      userId: session?.user?.id 
    });
    
    if (!session?.user) {
      console.error('[COURSE_OFFERING_CREATE] No session found - returning 401');
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const currentUser = await userRepository.findById(session.user.id);
    console.log('[COURSE_OFFERING_CREATE] User check:', { 
      hasUser: !!currentUser, 
      role: currentUser?.role,
      isAdmin: currentUser?.role === 'admin'
    });
    
    if (!currentUser || currentUser.role !== 'admin') {
      console.error('[COURSE_OFFERING_CREATE] User not admin - returning 403');
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    console.log('[COURSE_OFFERING_CREATE] Request body:', body);
    
    // Validate required fields
    if (!body.courseId || !body.semester || !body.year || !body.season) {
      console.error('[COURSE_OFFERING_CREATE] Missing required fields:', {
        hasCourseId: !!body.courseId,
        hasSemester: !!body.semester,
        hasYear: !!body.year,
        hasSeason: !!body.season
      });
      return NextResponse.json(
        { error: 'Missing required fields' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Validate season
    if (!['Fall', 'Spring'].includes(body.season)) {
      console.error('[COURSE_OFFERING_CREATE] Invalid season:', body.season);
      return NextResponse.json(
        { error: 'Invalid season. Must be Fall or Spring' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Check if offering already exists
    console.log('[COURSE_OFFERING_CREATE] Checking for duplicate offering...');
    const exists = await courseOfferingRepository.exists(
      body.courseId,
      body.year,
      body.season
    );

    if (exists) {
      console.error('[COURSE_OFFERING_CREATE] Duplicate offering found for:', {
        courseId: body.courseId,
        year: body.year,
        season: body.season
      });
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
    console.log('[COURSE_OFFERING_CREATE] Creating offering with input:', courseOfferingInput);
    const courseOffering = await courseOfferingRepository.create(courseOfferingInput);
    
    console.log('[COURSE_OFFERING_CREATE] Successfully created offering:', {
      id: courseOffering.id,
      courseId: courseOffering.courseId,
      semester: courseOffering.semester
    });

    return NextResponse.json(
      { data: courseOffering, message: 'Course offering created successfully' } as ApiResponse<CourseOffering>,
      { status: 201 }
    );
  } catch (error) {
    console.error('[COURSE_OFFERING_CREATE] Error creating course offering:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to create course offering' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}