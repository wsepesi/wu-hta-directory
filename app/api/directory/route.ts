import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, taAssignments, courseOfferings, courses, professors } from '@/lib/db/schema';
import { eq, and, desc, asc, like, or } from 'drizzle-orm';
import type { ApiResponse, PublicDirectoryEntry } from '@/lib/types';

/**
 * GET /api/directory
 * Public directory endpoint - no authentication required
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const gradYear = searchParams.get('gradYear');
    const location = searchParams.get('location');

    // Apply filters
    const conditions = [eq(users.role, 'head_ta')];

    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          like(users.firstName, searchTerm),
          like(users.lastName, searchTerm),
          like(users.location, searchTerm)
        )!
      );
    }

    if (gradYear) {
      conditions.push(eq(users.gradYear, parseInt(gradYear)));
    }

    if (location) {
      conditions.push(eq(users.location, location));
    }

    // Build final condition
    const whereCondition = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Execute query and get users with their assignments in a single query
    const directoryData = await db.select({
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      gradYear: users.gradYear,
      location: users.location,
      currentRole: users.currentRole,
      courseNumber: courses.courseNumber,
      courseName: courses.courseName,
      semester: courseOfferings.semester,
      professorFirstName: professors.firstName,
      professorLastName: professors.lastName,
      offeringYear: courseOfferings.year,
      offeringSeason: courseOfferings.season,
    })
    .from(users)
    .leftJoin(taAssignments, eq(taAssignments.userId, users.id))
    .leftJoin(courseOfferings, eq(taAssignments.courseOfferingId, courseOfferings.id))
    .leftJoin(courses, eq(courseOfferings.courseId, courses.id))
    .leftJoin(professors, eq(courseOfferings.professorId, professors.id))
    .where(whereCondition)
    .orderBy(asc(users.lastName), asc(users.firstName), desc(courseOfferings.year), desc(courseOfferings.season));

    // Group the results by user
    const userMap = new Map<string, PublicDirectoryEntry>();
    
    for (const row of directoryData) {
      if (!userMap.has(row.userId)) {
        userMap.set(row.userId, {
          id: row.userId,
          firstName: row.firstName,
          lastName: row.lastName,
          gradYear: row.gradYear ?? undefined,
          location: row.location ?? undefined,
          currentRole: row.currentRole ?? undefined,
          courses: [],
        });
      }
      
      const user = userMap.get(row.userId)!;
      
      // Add course if it exists
      if (row.courseNumber && row.courseName) {
        user.courses.push({
          courseNumber: row.courseNumber,
          courseName: row.courseName,
          semester: row.semester!,
          professor: row.professorFirstName && row.professorLastName
            ? `${row.professorFirstName} ${row.professorLastName}`
            : undefined,
        });
      }
    }
    
    const directory = Array.from(userMap.values());

    return NextResponse.json(
      { data: directory } as ApiResponse<PublicDirectoryEntry[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching directory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch directory' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

