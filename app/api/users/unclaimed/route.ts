import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, invitations, taAssignments, courseOfferings, courses, professors } from '@/lib/db/schema';
import { eq, and, desc, isNull, or, ilike } from 'drizzle-orm';
import type { ApiResponse } from '@/lib/types';

interface UnclaimedProfileWithDetails {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  gradYear: number | null;
  degreeProgram: string | null;
  location: string | null;
  createdAt: Date;
  recordedBy: string | null;
  recordedAt: Date | null;
  invitationSent: Date | null;
  assignments: Array<{
    id: string;
    courseOfferingId: string;
    hoursPerWeek: number | null;
    courseNumber: string;
    courseName: string;
    semester: string;
    year: number;
    season: string;
    professorName: string | null;
  }>;
  invitationStatus: {
    hasPendingInvitation: boolean;
    lastInvitedAt: Date | null;
    invitationExpiresAt: Date | null;
  };
  recorder: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

/**
 * GET /api/users/unclaimed
 * List unclaimed profiles with their TA assignments and invitation status
 * Requires admin authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    // Get search query parameter
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('search') || undefined;

    // Build where clause
    const baseCondition = eq(users.isUnclaimed, true);
    
    let whereClause;
    if (query) {
      // Build search conditions separately to ensure they're not undefined
      const searchConditions = [
        ilike(users.firstName, `%${query}%`),
        ilike(users.lastName, `%${query}%`),
        ilike(users.email, `%${query}%`)
      ];
      
      whereClause = and(
        baseCondition,
        or(...searchConditions)!  // Use non-null assertion since we know we have conditions
      );
    } else {
      whereClause = baseCondition;
    }

    // Create aliases for recorder user join
    const recorderUsers = db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
    }).from(users).as('recorderUsers');

    // Get all unclaimed profiles with their TA assignments and invitation status
    const unclaimedProfiles = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        gradYear: users.gradYear,
        degreeProgram: users.degreeProgram,
        location: users.location,
        createdAt: users.createdAt,
        recordedBy: users.recordedBy,
        recordedAt: users.recordedAt,
        invitationSent: users.invitationSent,
        assignments: {
          id: taAssignments.id,
          courseOfferingId: taAssignments.courseOfferingId,
          hoursPerWeek: taAssignments.hoursPerWeek,
          courseNumber: courses.courseNumber,
          courseName: courses.courseName,
          semester: courseOfferings.semester,
          year: courseOfferings.year,
          season: courseOfferings.season,
          professorFirstName: professors.firstName,
          professorLastName: professors.lastName,
        },
        lastInvitation: {
          id: invitations.id,
          createdAt: invitations.createdAt,
          expiresAt: invitations.expiresAt,
          usedAt: invitations.usedAt,
        },
        recorder: {
          id: recorderUsers.id,
          firstName: recorderUsers.firstName,
          lastName: recorderUsers.lastName,
        },
      })
      .from(users)
      .leftJoin(taAssignments, eq(taAssignments.userId, users.id))
      .leftJoin(courseOfferings, eq(courseOfferings.id, taAssignments.courseOfferingId))
      .leftJoin(courses, eq(courses.id, courseOfferings.courseId))
      .leftJoin(professors, eq(professors.id, courseOfferings.professorId))
      .leftJoin(
        invitations,
        and(
          eq(invitations.email, users.email),
          isNull(invitations.usedAt)
        )
      )
      .leftJoin(recorderUsers, eq(recorderUsers.id, users.recordedBy))
      .where(whereClause)
      .orderBy(desc(users.createdAt));

    // Group by user to aggregate assignments
    const profilesMap = new Map<string, UnclaimedProfileWithDetails>();
    
    for (const row of unclaimedProfiles) {
      if (!profilesMap.has(row.id)) {
        profilesMap.set(row.id, {
          id: row.id,
          email: row.email,
          firstName: row.firstName,
          lastName: row.lastName,
          gradYear: row.gradYear,
          degreeProgram: row.degreeProgram,
          location: row.location,
          createdAt: row.createdAt,
          recordedBy: row.recordedBy,
          recordedAt: row.recordedAt,
          invitationSent: row.invitationSent,
          assignments: [],
          invitationStatus: row.lastInvitation ? {
            hasPendingInvitation: row.lastInvitation.expiresAt > new Date(),
            lastInvitedAt: row.lastInvitation.createdAt,
            invitationExpiresAt: row.lastInvitation.expiresAt,
          } : {
            hasPendingInvitation: false,
            lastInvitedAt: null,
            invitationExpiresAt: null,
          },
          recorder: row.recorder?.id ? {
            id: row.recorder.id,
            firstName: row.recorder.firstName,
            lastName: row.recorder.lastName,
          } : null,
        });
      }
      
      if (row.assignments.id && row.assignments.courseOfferingId && row.assignments.courseNumber && row.assignments.courseName && row.assignments.semester && row.assignments.year !== null && row.assignments.season !== null) {
        const profile = profilesMap.get(row.id);
        if (profile) {
          profile.assignments.push({
            id: row.assignments.id,
            courseOfferingId: row.assignments.courseOfferingId,
            hoursPerWeek: row.assignments.hoursPerWeek,
            courseNumber: row.assignments.courseNumber,
            courseName: row.assignments.courseName,
            semester: row.assignments.semester,
            year: row.assignments.year,
            season: row.assignments.season,
            professorName: row.assignments.professorFirstName && row.assignments.professorLastName
              ? `${row.assignments.professorFirstName} ${row.assignments.professorLastName}`
              : null,
          });
        }
      }
    }

    const profiles = Array.from(profilesMap.values());

    return NextResponse.json(
      { 
        data: profiles,
        total: profiles.length 
      } as ApiResponse<UnclaimedProfileWithDetails[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching unclaimed profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unclaimed profiles' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}