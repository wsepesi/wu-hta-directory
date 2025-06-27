import { db } from './db';
import { courses, courseOfferings, taAssignments } from './db/schema';
import { eq, and, sql } from 'drizzle-orm';

type Season = 'fall' | 'spring' | 'summer';

interface PredictedOffering {
  courseId: string;
  courseNumber: string;
  courseName: string;
  predictedSemester: string;
  predictedYear: number;
  predictedSeason: Season;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

interface CourseOfferingValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface MissingTAAssignment {
  courseOfferingId: string;
  courseNumber: string;
  courseName: string;
  semester: string;
  professorName: string | null;
  daysSinceCreated: number;
}

/**
 * Predict future course offerings based on historical patterns
 */
export async function predictCourseOfferings(
  targetYear: number,
  targetSeason: Season
): Promise<PredictedOffering[]> {
  // Get all courses with their offering patterns
  const allCourses = await db.select().from(courses);
  
  // Get historical offerings for pattern analysis
  const historicalOfferings = await db
    .select({
      courseId: courseOfferings.courseId,
      year: courseOfferings.year,
      season: courseOfferings.season,
    })
    .from(courseOfferings)
    .orderBy(courseOfferings.year, courseOfferings.season);

  const predictions: PredictedOffering[] = [];

  for (const course of allCourses) {
    const courseHistory = historicalOfferings.filter(
      (o) => o.courseId === course.id
    );

    if (courseHistory.length === 0) {
      // No history, can't predict
      continue;
    }

    // Analyze historical patterns
    const fallOfferings = courseHistory.filter(h => h.season === 'fall').length;
    const springOfferings = courseHistory.filter(h => h.season === 'spring').length;
    const totalOfferings = courseHistory.length;
    
    // Get the last offering
    const lastOffering = courseHistory[courseHistory.length - 1];
    const semestersSinceLastOffering = 
      (targetYear - lastOffering.year) * 2 + 
      (targetSeason === 'fall' ? 1 : 0) - 
      (lastOffering.season === 'fall' ? 1 : 0);

    let prediction: PredictedOffering | null = null;
    
    // Determine pattern and make prediction
    if (totalOfferings >= 4) {
      const fallRatio = fallOfferings / totalOfferings;
      const springRatio = springOfferings / totalOfferings;
      
      // Offered almost every semester
      if (fallRatio > 0.8 && springRatio > 0.8) {
        prediction = {
          courseId: course.id,
          courseNumber: course.courseNumber,
          courseName: course.courseName,
          predictedSemester: `${targetSeason} ${targetYear}`,
          predictedYear: targetYear,
          predictedSeason: targetSeason,
          confidence: 'high',
          reason: 'Course is typically offered every semester',
        };
      }
      // Fall only pattern
      else if (fallRatio > 0.8 && springRatio < 0.2 && targetSeason === 'fall') {
        prediction = {
          courseId: course.id,
          courseNumber: course.courseNumber,
          courseName: course.courseName,
          predictedSemester: `${targetSeason} ${targetYear}`,
          predictedYear: targetYear,
          predictedSeason: targetSeason,
          confidence: 'high',
          reason: 'Course is typically offered only in fall',
        };
      }
      // Spring only pattern
      else if (springRatio > 0.8 && fallRatio < 0.2 && targetSeason === 'spring') {
        prediction = {
          courseId: course.id,
          courseNumber: course.courseNumber,
          courseName: course.courseName,
          predictedSemester: `${targetSeason} ${targetYear}`,
          predictedYear: targetYear,
          predictedSeason: targetSeason,
          confidence: 'high',
          reason: 'Course is typically offered only in spring',
        };
      }
      // Alternating pattern
      else if (semestersSinceLastOffering >= 2) {
        prediction = {
          courseId: course.id,
          courseNumber: course.courseNumber,
          courseName: course.courseName,
          predictedSemester: `${targetSeason} ${targetYear}`,
          predictedYear: targetYear,
          predictedSeason: targetSeason,
          confidence: 'medium',
          reason: 'Course may be offered based on historical frequency',
        };
      }
    }
    // Limited history, make conservative prediction
    else if (courseHistory.length >= 2 && semestersSinceLastOffering >= 2) {
      prediction = {
        courseId: course.id,
        courseNumber: course.courseNumber,
        courseName: course.courseName,
        predictedSemester: `${targetSeason} ${targetYear}`,
        predictedYear: targetYear,
        predictedSeason: targetSeason,
        confidence: 'low',
        reason: 'Limited history but may be offered',
      };
    }

    if (prediction) {
      predictions.push(prediction);
    }
  }

  return predictions;
}

/**
 * Validate course offering data
 */
export async function validateCourseOffering(
  courseId: string,
  professorId: string | null,
  semester: string,
  year: number,
  season: Season
): Promise<CourseOfferingValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate year
  const currentYear = new Date().getFullYear();
  if (year < currentYear - 10) {
    errors.push('Year is too far in the past (more than 10 years)');
  } else if (year > currentYear + 2) {
    errors.push('Year is too far in the future (more than 2 years)');
  }

  // Validate season
  if (!['fall', 'spring', 'summer'].includes(season)) {
    errors.push('Invalid season. Must be fall, spring, or summer');
  }

  // Check for duplicate offerings
  const existingOffering = await db
    .select()
    .from(courseOfferings)
    .where(
      and(
        eq(courseOfferings.courseId, courseId),
        eq(courseOfferings.year, year),
        eq(courseOfferings.season, season)
      )
    )
    .limit(1);

  if (existingOffering.length > 0) {
    errors.push('Course offering already exists for this semester');
  }

  // Analyze historical offering patterns for warnings
  const historicalOfferings = await db
    .select({
      season: courseOfferings.season,
    })
    .from(courseOfferings)
    .where(eq(courseOfferings.courseId, courseId))
    .orderBy(courseOfferings.year, courseOfferings.season);

  if (historicalOfferings.length >= 3) {
    const fallCount = historicalOfferings.filter(o => o.season === 'fall').length;
    const springCount = historicalOfferings.filter(o => o.season === 'spring').length;
    const summerCount = historicalOfferings.filter(o => o.season === 'summer').length;
    const total = historicalOfferings.length;

    // Check if course has a strong seasonal pattern
    if (fallCount / total > 0.8 && season !== 'fall') {
      warnings.push('Course is typically only offered in fall');
    } else if (springCount / total > 0.8 && season !== 'spring') {
      warnings.push('Course is typically only offered in spring');
    } else if (summerCount / total > 0.8 && season !== 'summer') {
      warnings.push('Course is typically only offered in summer');
    }
  }

  // Check professor workload
  if (professorId) {
    const professorOfferings = await db
      .select()
      .from(courseOfferings)
      .where(
        and(
          eq(courseOfferings.professorId, professorId),
          eq(courseOfferings.year, year),
          eq(courseOfferings.season, season)
        )
      );

    if (professorOfferings.length >= 3) {
      warnings.push('Professor already has 3 or more courses this semester');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Find courses without TA assignments
 */
export async function findMissingTAAssignments(): Promise<MissingTAAssignment[]> {
  const missingAssignments = await db
    .select({
      courseOfferingId: courseOfferings.id,
      courseNumber: courses.courseNumber,
      courseName: courses.courseName,
      semester: courseOfferings.semester,
      year: courseOfferings.year,
      season: courseOfferings.season,
      professorId: courseOfferings.professorId,
      createdAt: courseOfferings.createdAt,
      taCount: sql<number>`COUNT(${taAssignments.id})`,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .leftJoin(taAssignments, eq(courseOfferings.id, taAssignments.courseOfferingId))
    .groupBy(
      courseOfferings.id,
      courses.courseNumber,
      courses.courseName,
      courseOfferings.semester,
      courseOfferings.year,
      courseOfferings.season,
      courseOfferings.professorId,
      courseOfferings.createdAt
    )
    .having(sql`COUNT(${taAssignments.id}) = 0`);

  // Get professor names
  const professorIds = missingAssignments
    .filter(a => a.professorId)
    .map(a => a.professorId!);

  const professors = professorIds.length > 0
    ? await db
        .select({
          id: sql`id`,
          fullName: sql`first_name || ' ' || last_name`,
        })
        .from(sql`professors`)
        .where(sql`id = ANY(${professorIds})`)
    : [];

  const professorMap = new Map(
    professors.map(p => [p.id, p.fullName as string])
  );

  return missingAssignments.map(assignment => ({
    courseOfferingId: assignment.courseOfferingId,
    courseNumber: assignment.courseNumber,
    courseName: assignment.courseName,
    semester: assignment.semester,
    professorName: assignment.professorId
      ? professorMap.get(assignment.professorId) || null
      : null,
    daysSinceCreated: Math.floor(
      (Date.now() - new Date(assignment.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    ),
  }));
}