import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, taAssignments, courseOfferings, courses, professors } from '@/lib/db/schema';
import { eq, and, desc, asc, like } from 'drizzle-orm';
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

    // Build query for public directory
    let query = db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      gradYear: users.gradYear,
      location: users.location,
      currentRole: users.currentRole,
    })
    .from(users)
    .where(eq(users.role, 'head_ta')); // Only show head TAs in public directory

    // Apply filters
    const conditions = [eq(users.role, 'head_ta')];

    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      conditions.push(
        db.or(
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

    query = query.where(and(...conditions));

    // Execute query and get users
    const directoryUsers = await query.orderBy(asc(users.lastName), asc(users.firstName));

    // Get TA assignments for each user
    const directory: PublicDirectoryEntry[] = await Promise.all(
      directoryUsers.map(async (user) => {
        // Get TA assignments with course and professor info
        const assignments = await db.select({
          courseNumber: courses.courseNumber,
          courseName: courses.courseName,
          semester: courseOfferings.semester,
          professorFirstName: professors.firstName,
          professorLastName: professors.lastName,
        })
        .from(taAssignments)
        .innerJoin(courseOfferings, eq(taAssignments.courseOfferingId, courseOfferings.id))
        .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
        .leftJoin(professors, eq(courseOfferings.professorId, professors.id))
        .where(eq(taAssignments.userId, user.id))
        .orderBy(desc(courseOfferings.year), desc(courseOfferings.season));

        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          gradYear: user.gradYear,
          location: user.location,
          currentRole: user.currentRole,
          courses: assignments.map(a => ({
            courseNumber: a.courseNumber,
            courseName: a.courseName,
            semester: a.semester,
            professor: a.professorFirstName && a.professorLastName
              ? `${a.professorFirstName} ${a.professorLastName}`
              : undefined,
          })),
        };
      })
    );

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

