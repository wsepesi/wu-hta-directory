import { db } from './db';
import { users, taAssignments, courseOfferings, courses } from './db/schema';
import { eq, and, sql, ne } from 'drizzle-orm';

interface TAWorkload {
  userId: string;
  totalHoursPerWeek: number;
  assignments: {
    courseNumber: string;
    courseName: string;
    hoursPerWeek: number;
    semester: string;
  }[];
}

interface TAAssignmentSuggestion {
  userId: string;
  userName: string;
  courseOfferingId: string;
  courseNumber: string;
  courseName: string;
  score: number;
  reasons: string[];
  suggestedHours: number;
}

interface TAAvailability {
  canAssign: boolean;
  currentHours: number;
  maxHours: number;
  reasons: string[];
}

/**
 * Check if a TA can be assigned to a course
 */
export async function canAssignTA(
  userId: string,
  courseOfferingId: string,
  hoursPerWeek: number = 10
): Promise<TAAvailability> {
  const reasons: string[] = [];
  const maxHoursPerWeek = 20; // Maximum hours a TA can work per week

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
      reasons: ['TA is already assigned to this course'],
    };
  }

  // Calculate current workload for the same semester
  const currentWorkload = await calculateTAWorkload(
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
    reasons.push('TA already has 3 course assignments this semester');
  }

  return {
    canAssign: reasons.length === 0,
    currentHours: currentWorkload.totalHoursPerWeek,
    maxHours: maxHoursPerWeek,
    reasons,
  };
}

/**
 * Calculate total hours for a TA in a specific semester
 */
export async function calculateTAWorkload(
  userId: string,
  year?: number,
  season?: string
): Promise<TAWorkload> {
  let query = db
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
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .where(eq(taAssignments.userId, userId));

  // Filter by semester if provided
  if (year && season) {
    query = query.where(
      and(
        eq(taAssignments.userId, userId),
        eq(courseOfferings.year, year),
        eq(courseOfferings.season, season)
      )
    );
  }

  const assignments = await query;

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
export async function suggestTAAssignments(
  courseOfferingId: string,
  maxSuggestions: number = 5
): Promise<TAAssignmentSuggestion[]> {
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
  const suggestions: TAAssignmentSuggestion[] = [];

  for (const ta of headTAs) {
    let score = 100;
    const reasons: string[] = [];

    // Check if can be assigned
    const availability = await canAssignTA(ta.id, courseOfferingId);
    if (!availability.canAssign) {
      continue;
    }

    // Factor 1: Current workload (prefer TAs with fewer hours)
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
        reasons.push('Experienced TA (2+ years)');
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