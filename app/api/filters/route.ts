import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userRepository } from '@/lib/repositories/users';
import { courseOfferingRepository } from '@/lib/repositories/course-offerings';
import type { ApiResponse } from '@/lib/types';

interface FilterOptions {
  locations: string[];
  gradYears: number[];
  semesters: string[];
}

/**
 * GET /api/filters
 * Get available filter options for dropdowns
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

    // Get distinct values for filters
    const [locations, gradYears, semesters] = await Promise.all([
      userRepository.getDistinctLocations(),
      userRepository.getDistinctGradYears(),
      courseOfferingRepository.getDistinctSemesters(),
    ]);

    const filters: FilterOptions = {
      locations,
      gradYears,
      semesters,
    };

    return NextResponse.json(
      { data: filters } as ApiResponse<FilterOptions>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}