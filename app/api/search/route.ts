import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userRepository } from '@/lib/repositories/users';
import { courseRepository } from '@/lib/repositories/courses';
import { professorRepository } from '@/lib/repositories/professors';
import { getPublicDirectory } from '@/lib/public-directory';
import type { ApiResponse, User, Course, Professor } from '@/lib/types';

interface SearchResults {
  users: User[];
  courses: Course[];
  professors: Professor[];
}

/**
 * GET /api/search
 * Global search across users, courses, and professors
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // users, courses, professors, or all

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const results: SearchResults = {
      users: [],
      courses: [],
      professors: [],
    };

    // Perform searches based on type parameter
    if (!type || type === 'all' || type === 'users') {
      if (session?.user) {
        // Authenticated users can search all users
        results.users = await userRepository.search(query);
      } else {
        // Unauthenticated users get public directory results
        const profiles = await getPublicDirectory({ search: query, limit: 10 });
        results.users = profiles.map(profile => ({
          id: profile.id,
          email: '', // Don't expose email publicly
          firstName: profile.firstName,
          lastName: profile.lastName,
          gradYear: profile.gradYear,
          degreeProgram: undefined,
          currentRole: profile.currentRole,
          linkedinUrl: undefined,
          personalSite: undefined,
          location: profile.location,
          role: 'head_ta' as const,
          invitedBy: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      }
    }

    if (!type || type === 'all' || type === 'courses') {
      // Courses are public
      results.courses = await courseRepository.search(query);
    }

    if (!type || type === 'all' || type === 'professors') {
      // Professors are public
      results.professors = await professorRepository.search(query);
    }

    // If searching for a specific type, return only that type
    if (type && type !== 'all') {
      const specificResults = results[type as keyof SearchResults];
      return NextResponse.json(
        { data: specificResults } as ApiResponse<User[] | Course[] | Professor[]>,
        { status: 200 }
      );
    }

    // Return all results
    return NextResponse.json(
      { data: results } as ApiResponse<SearchResults>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error performing search:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}