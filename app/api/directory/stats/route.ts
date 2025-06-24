import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, courses } from '@/lib/db/schema';
import { eq, and, asc, desc, sql, isNotNull } from 'drizzle-orm';
import type { ApiResponse } from '@/lib/types';

/**
 * GET /api/directory/stats
 * Public stats endpoint - no authentication required
 */
export async function GET(request: NextRequest) {
  try {
    // Get count of head TAs
    const headTACount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, 'head_ta'));

    // Get distinct locations
    const locations = await db
      .selectDistinct({ location: users.location })
      .from(users)
      .where(and(
        eq(users.role, 'head_ta'),
        isNotNull(users.location)
      ))
      .orderBy(asc(users.location));

    // Get distinct grad years
    const gradYears = await db
      .selectDistinct({ gradYear: users.gradYear })
      .from(users)
      .where(and(
        eq(users.role, 'head_ta'),
        isNotNull(users.gradYear)
      ))
      .orderBy(desc(users.gradYear));

    // Get count of courses
    const courseCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(courses);

    const stats = {
      totalHeadTAs: headTACount[0]?.count || 0,
      locations: locations.map(l => l.location).filter(Boolean) as string[],
      gradYears: gradYears.map(g => g.gradYear).filter(Boolean) as number[],
      totalCourses: courseCount[0]?.count || 0,
    };

    return NextResponse.json(
      { data: stats } as ApiResponse<typeof stats>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching directory stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch directory stats' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}