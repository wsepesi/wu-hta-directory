import { db } from './db';
import { users, taAssignments, courseOfferings, courses } from './db/schema';
import { eq, sql, and, or, ilike } from 'drizzle-orm';

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
): Promise<{
  profiles: PublicUserProfile[];
  total: number;
  hasMore: boolean;
}> {
  const {
    search,
    gradYear,
    gradYearRange,
    degreeProgram,
    location,
    coursesTaught,
    sortBy = 'name',
    sortOrder = 'asc',
    limit = 20,
    offset = 0,
  } = filters;
  
  // Build base query
  let query = db
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
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, 'head_ta')); // Only show head TAs in public directory
  
  // Apply filters
  const conditions = [];
  
  if (search) {
    const searchTerm = `%${search}%`;
    conditions.push(
      or(
        ilike(users.firstName, searchTerm),
        ilike(users.lastName, searchTerm),
        ilike(users.currentRole, searchTerm),
        ilike(users.degreeProgram, searchTerm),
        ilike(users.location, searchTerm),
        sql`${users.firstName} || ' ' || ${users.lastName} ILIKE ${searchTerm}`
      )
    );
  }
  
  if (gradYear) {
    conditions.push(eq(users.gradYear, gradYear));
  }
  
  if (gradYearRange) {
    if (gradYearRange.min) {
      conditions.push(sql`${users.gradYear} >= ${gradYearRange.min}`);
    }
    if (gradYearRange.max) {
      conditions.push(sql`${users.gradYear} <= ${gradYearRange.max}`);
    }
  }
  
  if (degreeProgram) {
    conditions.push(ilike(users.degreeProgram, `%${degreeProgram}%`));
  }
  
  if (location) {
    conditions.push(ilike(users.location, `%${location}%`));
  }
  
  // Apply conditions to query
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  // Apply sorting
  switch (sortBy) {
    case 'name':
      query = query.orderBy(
        sortOrder === 'asc' 
          ? sql`${users.lastName}, ${users.firstName}` 
          : sql`${users.lastName} DESC, ${users.firstName} DESC`
      );
      break;
    case 'gradYear':
      query = query.orderBy(
        sortOrder === 'asc' 
          ? sql`${users.gradYear} ASC NULLS LAST` 
          : sql`${users.gradYear} DESC NULLS LAST`
      );
      break;
    case 'recentActivity':
      query = query.orderBy(
        sortOrder === 'asc' 
          ? users.createdAt 
          : sql`${users.createdAt} DESC`
      );
      break;
  }
  
  // Get total count before pagination
  const countQuery = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(eq(users.role, 'head_ta'));
  
  if (conditions.length > 0) {
    countQuery.where(and(...conditions));
  }
  
  const totalResult = await countQuery;
  const total = totalResult[0]?.count || 0;
  
  // Apply pagination
  const profiles = await query.limit(limit).offset(offset);
  
  // Get courses taught for each user
  const userIds = profiles.map(p => p.id);
  const courseData = userIds.length > 0 
    ? await db
        .select({
          userId: taAssignments.userId,
          courseNumber: courses.courseNumber,
          courseName: courses.courseName,
          semester: courseOfferings.semester,
          year: courseOfferings.year,
        })
        .from(taAssignments)
        .innerJoin(courseOfferings, eq(taAssignments.courseOfferingId, courseOfferings.id))
        .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
        .where(sql`${taAssignments.userId} = ANY(${userIds})`)
        .orderBy(courseOfferings.year, courseOfferings.semester)
    : [];
  
  // Group courses by user
  const coursesByUser = courseData.reduce((acc, course) => {
    if (!acc[course.userId]) {
      acc[course.userId] = [];
    }
    acc[course.userId].push({
      courseNumber: course.courseNumber,
      courseName: course.courseName,
      semester: course.semester,
      year: course.year,
    });
    return acc;
  }, {} as Record<string, typeof courseData>);
  
  // Filter by courses taught if specified
  let filteredProfiles = profiles;
  if (coursesTaught && coursesTaught.length > 0) {
    filteredProfiles = profiles.filter(profile => {
      const userCourses = coursesByUser[profile.id] || [];
      return coursesTaught.some(courseNum => 
        userCourses.some(c => c.courseNumber === courseNum)
      );
    });
  }
  
  // Build final profiles
  const publicProfiles: PublicUserProfile[] = filteredProfiles.map(profile => ({
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    gradYear: profile.gradYear || undefined,
    degreeProgram: profile.degreeProgram || undefined,
    currentRole: profile.currentRole || undefined,
    linkedinUrl: profile.linkedinUrl || undefined,
    personalSite: profile.personalSite || undefined,
    location: profile.location || undefined,
    coursesTaught: coursesByUser[profile.id] || [],
  }));
  
  return {
    profiles: publicProfiles,
    total,
    hasMore: offset + limit < total,
  };
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
export async function getDirectoryStats(): Promise<DirectoryStats> {
  // Total users
  const userCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(eq(users.role, 'head_ta'));
  
  // Total courses taught
  const assignmentCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(taAssignments);
  
  // Unique courses
  const uniqueCourseCount = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${courses.id})` })
    .from(courses)
    .innerJoin(courseOfferings, eq(courses.id, courseOfferings.courseId))
    .innerJoin(taAssignments, eq(courseOfferings.id, taAssignments.courseOfferingId));
  
  // Graduation years
  const gradYears = await db
    .select({ year: users.gradYear })
    .from(users)
    .where(
      and(
        eq(users.role, 'head_ta'),
        sql`${users.gradYear} IS NOT NULL`
      )
    )
    .groupBy(users.gradYear)
    .orderBy(users.gradYear);
  
  // Degree programs
  const programs = await db
    .select({ program: users.degreeProgram })
    .from(users)
    .where(
      and(
        eq(users.role, 'head_ta'),
        sql`${users.degreeProgram} IS NOT NULL`
      )
    )
    .groupBy(users.degreeProgram)
    .orderBy(users.degreeProgram);
  
  // Locations
  const locations = await db
    .select({ location: users.location })
    .from(users)
    .where(
      and(
        eq(users.role, 'head_ta'),
        sql`${users.location} IS NOT NULL`
      )
    )
    .groupBy(users.location)
    .orderBy(users.location);
  
  return {
    totalUsers: userCount[0]?.count || 0,
    totalCoursesTaught: assignmentCount[0]?.count || 0,
    uniqueCourses: uniqueCourseCount[0]?.count || 0,
    graduationYears: gradYears.map(g => g.year!).filter(y => y !== null),
    degreePrograms: programs.map(p => p.program!).filter(p => p !== null),
    locations: locations.map(l => l.location!).filter(l => l !== null),
  };
}