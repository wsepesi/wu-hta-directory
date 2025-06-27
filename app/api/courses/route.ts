import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { courseRepository } from '@/lib/repositories/courses';
import { userRepository } from '@/lib/repositories/users';
import { logApiError } from '@/lib/error-logger';
import { courseSchema, validateData } from '@/lib/validation';
import type { ApiResponse, Course, CreateCourseInput } from '@/lib/types';

/**
 * GET /api/courses
 * Get all courses with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Public endpoint - no authentication required for GET

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    
    let courses: Course[];
    if (search) {
      courses = await courseRepository.search(search);
    } else {
      courses = await courseRepository.findAll();
    }

    return NextResponse.json(
      { data: courses } as ApiResponse<Course[]>,
      { status: 200 }
    );
  } catch (error) {
    logApiError(
      error as Error,
      {
        method: request.method,
        url: request.url,
      },
      {
        statusCode: 500,
      }
    );
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch courses',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses
 * Create a new course (admin only)
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
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' } as ApiResponse<never>,
        { status: 400 }
      );
    }
    
    // Validate input using schema
    const validation = validateData(courseSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          validationErrors: validation.errors 
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const courseInput: CreateCourseInput = validation.data;

    // Create course
    const course = await courseRepository.create(courseInput);

    return NextResponse.json(
      { data: course, message: 'Course created successfully' } as ApiResponse<Course>,
      { status: 201 }
    );
  } catch (error) {
    logApiError(
      error as Error,
      {
        method: request.method,
        url: request.url,
        body: await request.text(),
      },
      {
        statusCode: error instanceof Error && error.message.includes('already exists') ? 409 : 500,
      }
    );
    
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'Course with this number already exists' } as ApiResponse<never>,
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create course',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}