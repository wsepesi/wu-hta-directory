import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userRepository } from '@/lib/repositories/users';
import { courseOfferingRepository } from '@/lib/repositories/course-offerings';
import { getDirectoryStats } from '@/lib/public-directory';
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
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    // If authenticated, get full filter data
    if (session?.user) {
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
    }
    
    // For unauthenticated users, provide public directory stats
    const stats = await getDirectoryStats();
    
    const publicFilters: FilterOptions = {
      locations: stats.locations,
      gradYears: stats.gradYears,
      semesters: [], // Don't expose semesters publicly
    };

    return NextResponse.json(
      { data: publicFilters } as ApiResponse<FilterOptions>,
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