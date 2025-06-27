import { db } from './db';
import { users, taAssignments, courseOfferings, courses } from './db/schema';
import { eq, and, ne } from 'drizzle-orm';

interface HeadTAWorkload {
  userId: string;
  totalHoursPerWeek: number;
  assignments: {
    courseNumber: string;
    courseName: string;
    hoursPerWeek: number;
    semester: string;
  }[];
}

interface HeadTARecordSuggestion {
  userId: string;
  userName: string;
  courseOfferingId: string;
  courseNumber: string;
  courseName: string;
  score: number;
  reasons: string[];
  suggestedHours: number;
}

interface HeadTAAvailability {
  canAssign: boolean;
  currentHours: number;
  maxHours: number;
  reasons: string[];
}

/**
 * Check if a TA can be assigned to a course
 */
export async function canRecordHeadTA(
  userId: string,
  courseOfferingId: string,
  hoursPerWeek: number = 10
): Promise<HeadTAAvailability> {
  const reasons: string[] = [];
  const maxHoursPerWeek = 20; // Maximum hours a Head TA can work per week

  // Check if user exists and is a head TA
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user.length === 0) {
    return {
      canAssign: false,
      currentHours: 0,
      maxHours: maxHoursPerWeek,
      reasons: ['User not found'],
    };
  }

  if (user[0].role !== 'head_ta') {
    return {
      canAssign: false,
      currentHours: 0,
      maxHours: maxHoursPerWeek,
      reasons: ['User is not a head TA'],
    };
  }

  // Get course offering details
  const offering = await db
    .select({
      id: courseOfferings.id,
      year: courseOfferings.year,
      season: courseOfferings.season,
    })
    .from(courseOfferings)
    .where(eq(courseOfferings.id, courseOfferingId))
    .limit(1);

  if (offering.length === 0) {
    return {
      canAssign: false,
      currentHours: 0,
      maxHours: maxHoursPerWeek,
      reasons: ['Course offering not found'],
    };
  }

  // Check if already assigned to this course
  const existingAssignment = await db
    .select()
    .from(taAssignments)
    .where(
      and(
        eq(taAssignments.userId, userId),
        eq(taAssignments.courseOfferingId, courseOfferingId)
      )
    )
    .limit(1);

  if (existingAssignment.length > 0) {
    return {
      canAssign: false,
      currentHours: 0,
      maxHours: maxHoursPerWeek,
      reasons: ['Head TA is already recorded for this course'],
    };
  }

  // Calculate current workload for the same semester
  const currentWorkload = await calculateHeadTAWorkload(
    userId,
    offering[0].year,
    offering[0].season
  );

  const totalHoursWithNew = currentWorkload.totalHoursPerWeek + hoursPerWeek;

  if (totalHoursWithNew > maxHoursPerWeek) {
    reasons.push(
      `Adding ${hoursPerWeek} hours would exceed maximum of ${maxHoursPerWeek} hours per week`
    );
  }

  if (currentWorkload.assignments.length >= 3) {
    reasons.push('Head TA already has 3 course records this semester');
  }

  return {
    canAssign: reasons.length === 0,
    currentHours: currentWorkload.totalHoursPerWeek,
    maxHours: maxHoursPerWeek,
    reasons,
  };
}

/**
 * Calculate total hours for a Head TA in a specific semester
 */
export async function calculateHeadTAWorkload(
  userId: string,
  year?: number,
  season?: string
): Promise<HeadTAWorkload> {
  const baseQuery = db
    .select({
      assignmentId: taAssignments.id,
      hoursPerWeek: taAssignments.hoursPerWeek,
      courseNumber: courses.courseNumber,
      courseName: courses.courseName,
      semester: courseOfferings.semester,
      year: courseOfferings.year,
      season: courseOfferings.season,
    })
    .from(taAssignments)
    .innerJoin(courseOfferings, eq(taAssignments.courseOfferingId, courseOfferings.id))
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id));

  // Filter by semester if provided
  let assignments;
  if (year && season) {
    assignments = await baseQuery.where(
      and(
        eq(taAssignments.userId, userId),
        eq(courseOfferings.year, year),
        eq(courseOfferings.season, season)
      )
    );
  } else {
    assignments = await baseQuery.where(eq(taAssignments.userId, userId));
  }

  const totalHours = assignments.reduce(
    (sum, assignment) => sum + (assignment.hoursPerWeek || 10),
    0
  );

  return {
    userId,
    totalHoursPerWeek: totalHours,
    assignments: assignments.map(a => ({
      courseNumber: a.courseNumber,
      courseName: a.courseName,
      hoursPerWeek: a.hoursPerWeek || 10,
      semester: a.semester,
    })),
  };
}

/**
 * Suggest TA assignments based on various factors
 */
export interface BulkHistoricalAssignment {
  firstName: string;
  lastName: string;
  email?: string;
  courseOfferingId: string;
  hoursPerWeek?: number;
  responsibilities?: string;
  gradYear?: number;
  degreeProgram?: string;
  location?: string;
}

/**
 * Create multiple historical TA assignments without sending invitations
 */
export async function createHistoricalRecords(
  assignments: BulkHistoricalAssignment[]
): Promise<{
  created: number;
  skipped: number;
  errors: Array<{ index: number; error: string }>;
}> {
  const result = {
    created: 0,
    skipped: 0,
    errors: [] as Array<{ index: number; error: string }>
  };

  for (let i = 0; i < assignments.length; i++) {
    const assignment = assignments[i];
    
    try {
      // Check if course offering exists
      const offering = await db
        .select()
        .from(courseOfferings)
        .where(eq(courseOfferings.id, assignment.courseOfferingId))
        .limit(1);

      if (offering.length === 0) {
        result.errors.push({
          index: i,
          error: `Course offering ${assignment.courseOfferingId} not found`
        });
        result.skipped++;
        continue;
      }

      // Check if user already exists (unclaimed or regular)
      let userId: string | null = null;
      
      // First check for unclaimed profile
      const unclaimedUser = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.firstName, assignment.firstName),
            eq(users.lastName, assignment.lastName),
            eq(users.isUnclaimed, true)
          )
        )
        .limit(1);

      if (unclaimedUser.length > 0) {
        userId = unclaimedUser[0].id;
      } else {
        // Create unclaimed profile
        const email = assignment.email || 
          `unclaimed.${assignment.firstName.toLowerCase()}.${assignment.lastName.toLowerCase()}.${Date.now()}@placeholder.edu`;
        
        const newUser = await db
          .insert(users)
          .values({
            firstName: assignment.firstName,
            lastName: assignment.lastName,
            email,
            passwordHash: 'UNCLAIMED_PROFILE',
            gradYear: assignment.gradYear,
            degreeProgram: assignment.degreeProgram,
            location: assignment.location,
            role: 'head_ta',
            isUnclaimed: true,
          })
          .returning();

        if (newUser.length > 0) {
          userId = newUser[0].id;
        }
      }

      if (!userId) {
        result.errors.push({
          index: i,
          error: 'Failed to create or find user profile'
        });
        result.skipped++;
        continue;
      }

      // Check if assignment already exists
      const existingAssignment = await db
        .select()
        .from(taAssignments)
        .where(
          and(
            eq(taAssignments.userId, userId),
            eq(taAssignments.courseOfferingId, assignment.courseOfferingId)
          )
        )
        .limit(1);

      if (existingAssignment.length > 0) {
        result.errors.push({
          index: i,
          error: `Assignment already exists for ${assignment.firstName} ${assignment.lastName}`
        });
        result.skipped++;
        continue;
      }

      // Create Head TA record
      await db
        .insert(taAssignments)
        .values({
          userId,
          courseOfferingId: assignment.courseOfferingId,
          hoursPerWeek: assignment.hoursPerWeek,
          responsibilities: assignment.responsibilities || 'Head TA (historical record)',
        });

      result.created++;
    } catch (error) {
      console.error(`Error processing assignment ${i}:`, error);
      result.errors.push({
        index: i,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      result.skipped++;
    }
  }

  return result;
}

export async function suggestHTARecords(
  courseOfferingId: string,
  maxSuggestions: number = 5
): Promise<HeadTARecordSuggestion[]> {
  // Get course offering details
  const offeringDetails = await db
    .select({
      courseId: courseOfferings.courseId,
      year: courseOfferings.year,
      season: courseOfferings.season,
      courseNumber: courses.courseNumber,
      courseName: courses.courseName,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .where(eq(courseOfferings.id, courseOfferingId))
    .limit(1);

  if (offeringDetails.length === 0) {
    return [];
  }

  const offering = offeringDetails[0];

  // Get all head TAs
  const headTAs = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      gradYear: users.gradYear,
    })
    .from(users)
    .where(eq(users.role, 'head_ta'));

  // Calculate scores for each TA
  const suggestions: HeadTARecordSuggestion[] = [];

  for (const ta of headTAs) {
    let score = 100;
    const reasons: string[] = [];

    // Check if can be assigned
    const availability = await canRecordHeadTA(ta.id, courseOfferingId);
    if (!availability.canAssign) {
      continue;
    }

    // Factor 1: Current workload (prefer HTAs with fewer hours)
    const workloadScore = Math.max(0, 40 - (availability.currentHours * 2));
    score += workloadScore;
    if (availability.currentHours < 10) {
      reasons.push('Has availability for more courses');
    }

    // Factor 2: Previous experience with similar courses
    const previousAssignments = await db
      .select({
        courseId: courseOfferings.courseId,
      })
      .from(taAssignments)
      .innerJoin(courseOfferings, eq(taAssignments.courseOfferingId, courseOfferings.id))
      .where(
        and(
          eq(taAssignments.userId, ta.id),
          ne(courseOfferings.id, courseOfferingId)
        )
      );

    const hasTaughtSameCourse = previousAssignments.some(
      a => a.courseId === offering.courseId
    );

    if (hasTaughtSameCourse) {
      score += 30;
      reasons.push('Has taught this course before');
    }

    // Factor 3: Graduation year (prefer more experienced TAs)
    if (ta.gradYear) {
      const currentYear = new Date().getFullYear();
      const yearsExperience = currentYear - ta.gradYear;
      if (yearsExperience >= 2) {
        score += 20;
        reasons.push('Experienced Head TA (2+ years)');
      }
    }

    // Factor 4: Random factor for diversity
    score += Math.random() * 10;

    // Suggest hours based on course complexity (simplified)
    const suggestedHours = offering.courseNumber.startsWith('6') ? 15 : 10;

    suggestions.push({
      userId: ta.id,
      userName: `${ta.firstName} ${ta.lastName}`,
      courseOfferingId,
      courseNumber: offering.courseNumber,
      courseName: offering.courseName,
      score,
      reasons,
      suggestedHours,
    });
  }

  // Sort by score and return top suggestions
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions);
}