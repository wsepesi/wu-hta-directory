import { db } from './db';
import { users, taAssignments, courseOfferings, courses, professors } from './db/schema';
import { eq, sql, and, or, ilike, asc, desc } from 'drizzle-orm';
import { withTimeoutFallback } from './db/query-timeout';
import { cache, cacheKeys, cacheTTL } from './cache';

export interface PublicUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  gradYear?: number;
  degreeProgram?: string;
  currentRole?: string;
  linkedinUrl?: string;
  personalSite?: string;
  location?: string;
  coursesTaught: Array<{
    courseNumber: string;
    courseName: string;
    semester: string;
    year: number;
  }>;
}

export interface DirectoryFilters {
  search?: string;
  gradYear?: number;
  gradYearRange?: {
    min?: number;
    max?: number;
  };
  degreeProgram?: string;
  location?: string;
  coursesTaught?: string[];
  sortBy?: 'name' | 'gradYear' | 'recentActivity';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface DirectoryStats {
  totalUsers: number;
  totalCoursesTaught: number;
  uniqueCourses: number;
  graduationYears: number[];
  degreePrograms: string[];
  locations: string[];
}

/**
 * Get public profiles for the directory
 */
export async function getPublicDirectory(
  filters: DirectoryFilters = {}
): Promise<Array<{
  id: string;
  firstName: string;
  lastName: string;
  gradYear?: number;
  location?: string;
  currentRole?: string;
  courses: Array<{
    courseNumber: string;
    courseName: string;
    semester: string;
    professor?: string;
  }>;
}>> {
  // Try to get from cache first
  const cacheKey = cacheKeys.directoryFiltered(filters as Record<string, unknown>);
  const cached = cache.get<Array<{
    id: string;
    firstName: string;
    lastName: string;
    gradYear?: number;
    location?: string;
    currentRole?: string;
    courses: Array<{
      courseNumber: string;
      courseName: string;
      semester: string;
      professor?: string;
    }>;
  }>>(cacheKey);
  
  if (cached !== null) {
    return cached;
  }
  const {
    search,
    gradYear,
    location,
    limit = 50,  // Default limit to prevent large result sets
    offset = 0,
  } = filters;
  
  // Build all conditions first
  const conditions = [eq(users.role, 'head_ta')]; // Only show head TAs in public directory
  
  if (search) {
    const searchTerm = `%${search.toLowerCase()}%`;
    const searchCondition = or(
      ilike(users.firstName, searchTerm),
      ilike(users.lastName, searchTerm),
      ilike(users.location, searchTerm)
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }
  
  if (gradYear) {
    conditions.push(eq(users.gradYear, typeof gradYear === 'string' ? parseInt(gradYear) : gradYear));
  }
  
  if (location) {
    conditions.push(eq(users.location, location));
  }

  // First, get the users with pagination
  const usersQuery = db.select({
    id: users.id,
    firstName: users.firstName,
    lastName: users.lastName,
    gradYear: users.gradYear,
    location: users.location,
    currentRole: users.currentRole,
  })
  .from(users)
  .where(and(...conditions))
  .orderBy(asc(users.lastName), asc(users.firstName))
  .limit(limit)
  .offset(offset);
  
  const usersList = await withTimeoutFallback(usersQuery, [], 5000, 'getPublicDirectory.users');
  
  if (usersList.length === 0) {
    return [];
  }
  
  // Get user IDs for course fetching
  const userIds = usersList.map(u => u.id);
  
  // Fetch courses for all users in one query
  const coursesQuery = db.select({
    userId: taAssignments.userId,
    courseNumber: courses.courseNumber,
    courseName: courses.courseName,
    semester: courseOfferings.semester,
    professorFirstName: professors.firstName,
    professorLastName: professors.lastName,
    offeringYear: courseOfferings.year,
    offeringSeason: courseOfferings.season,
  })
  .from(taAssignments)
  .innerJoin(courseOfferings, eq(taAssignments.courseOfferingId, courseOfferings.id))
  .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
  .leftJoin(professors, eq(courseOfferings.professorId, professors.id))
  .where(sql`${taAssignments.userId} = ANY(${userIds})`)
  .orderBy(desc(courseOfferings.year), desc(courseOfferings.season));
  
  const coursesData = await withTimeoutFallback(coursesQuery, [], 5000, 'getPublicDirectory.courses');

  // Create user map from users list
  const userMap = new Map<string, {
    id: string;
    firstName: string;
    lastName: string;
    gradYear?: number;
    location?: string;
    currentRole?: string;
    courses: Array<{
      courseNumber: string;
      courseName: string;
      semester: string;
      professor?: string;
    }>;
  }>();
  
  // Initialize users
  for (const user of usersList) {
    userMap.set(user.id, {
      ...user,
      gradYear: user.gradYear ?? undefined,
      location: user.location ?? undefined,
      currentRole: user.currentRole ?? undefined,
      courses: [],
    });
  }
  
  // Add courses to users
  for (const course of coursesData) {
    const user = userMap.get(course.userId);
    if (user && course.courseNumber && course.courseName) {
      user.courses.push({
        courseNumber: course.courseNumber,
        courseName: course.courseName,
        semester: course.semester!,
        professor: course.professorFirstName && course.professorLastName
          ? `${course.professorFirstName} ${course.professorLastName}`
          : undefined,
      });
    }
  }
  
  // Return users in the same order as the query
  const result = usersList.map(u => userMap.get(u.id)!);
  
  // Cache the result for 5 minutes
  cache.set(cacheKey, result, cacheTTL.medium);
  
  return result;
}

/**
 * Get a single public profile
 */
export async function getPublicProfile(userId: string): Promise<PublicUserProfile | null> {
  const user = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      gradYear: users.gradYear,
      degreeProgram: users.degreeProgram,
      currentRole: users.currentRole,
      linkedinUrl: users.linkedinUrl,
      personalSite: users.personalSite,
      location: users.location,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (user.length === 0 || user[0].role !== 'head_ta') {
    return null;
  }
  
  const profile = user[0];
  
  // Get courses taught
  const coursesTaught = await db
    .select({
      courseNumber: courses.courseNumber,
      courseName: courses.courseName,
      semester: courseOfferings.semester,
      year: courseOfferings.year,
    })
    .from(taAssignments)
    .innerJoin(courseOfferings, eq(taAssignments.courseOfferingId, courseOfferings.id))
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .where(eq(taAssignments.userId, userId))
    .orderBy(courseOfferings.year, courseOfferings.semester);
  
  return {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    gradYear: profile.gradYear || undefined,
    degreeProgram: profile.degreeProgram || undefined,
    currentRole: profile.currentRole || undefined,
    linkedinUrl: profile.linkedinUrl || undefined,
    personalSite: profile.personalSite || undefined,
    location: profile.location || undefined,
    coursesTaught,
  };
}

/**
 * Get directory statistics
 */
export async function getDirectoryStats(): Promise<{
  locations: string[];
  gradYears: number[];
}> {
  // Try cache first
  const cacheKey = 'directory:stats';
  const cached = cache.get<{
    locations: string[];
    gradYears: number[];
  }>(cacheKey);
  
  if (cached !== null) {
    return cached;
  }
  
  try {
    // Get distinct locations
    const locationsQuery = db
      .selectDistinct({ location: users.location })
      .from(users)
      .where(and(
        eq(users.role, 'head_ta'),
        sql`${users.location} IS NOT NULL`
      ))
      .orderBy(asc(users.location));

    // Get distinct grad years
    const gradYearsQuery = db
      .selectDistinct({ gradYear: users.gradYear })
      .from(users)
      .where(and(
        eq(users.role, 'head_ta'),
        sql`${users.gradYear} IS NOT NULL`
      ))
      .orderBy(desc(users.gradYear));

    const [locations, gradYears] = await Promise.all([
      withTimeoutFallback(locationsQuery, [], 5000, 'getDirectoryStats.locations'),
      withTimeoutFallback(gradYearsQuery, [], 5000, 'getDirectoryStats.gradYears')
    ]);

    const result = {
      locations: locations.map(l => l.location).filter(Boolean) as string[],
      gradYears: gradYears.map(g => g.gradYear).filter(Boolean) as number[],
    };
    
    // Cache for 10 minutes since stats change infrequently
    cache.set(cacheKey, result, cacheTTL.long);
    
    return result;
  } catch (error) {
    console.error('Error getting directory stats:', error);
    return {
      locations: [],
      gradYears: [],
    };
  }
}