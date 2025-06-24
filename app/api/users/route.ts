import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userRepository } from '@/lib/repositories/users';
import type { ApiResponse, User, UserFilters } from '@/lib/types';

/**
 * GET /api/users
 * Get all users with optional filters
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
    const filters: UserFilters = {};

    const gradYear = searchParams.get('gradYear');
    if (gradYear) {
      filters.gradYear = parseInt(gradYear);
    }

    const location = searchParams.get('location');
    if (location) {
      filters.location = location;
    }

    const degreeProgram = searchParams.get('degreeProgram');
    if (degreeProgram) {
      filters.degreeProgram = degreeProgram;
    }

    // Search query
    const search = searchParams.get('search');
    
    let users: User[];
    if (search) {
      users = await userRepository.search(search);
    } else {
      users = await userRepository.findAll(filters);
    }

    return NextResponse.json(
      { data: users } as ApiResponse<User[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create a new user (admin only)
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

    // Check if user is admin
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
    if (!body.email || !body.password || !body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Create user
    const user = await userRepository.create({
      ...body,
      invitedBy: session.user.id,
    });

    return NextResponse.json(
      { data: user, message: 'User created successfully' } as ApiResponse<User>,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'User with this email already exists' } as ApiResponse<never>,
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create user' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}