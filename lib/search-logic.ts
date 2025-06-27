import { db } from './db';
import { users, courses, professors, courseOfferings, taAssignments } from './db/schema';
import { or, ilike, sql, eq } from 'drizzle-orm';

interface SearchResult {
  type: 'user' | 'course' | 'professor';
  id: string;
  title: string;
  subtitle: string;
  metadata: Record<string, unknown>;
  score: number;
}

interface SearchOptions {
  query: string;
  types?: ('user' | 'course' | 'professor')[];
  limit?: number;
  includePrivate?: boolean;
}

/**
 * Perform a global search across all entities
 */
export async function performGlobalSearch(options: SearchOptions): Promise<SearchResult[]> {
  const { query, types = ['user', 'course', 'professor'], limit = 20, includePrivate = false } = options;
  
  const results: SearchResult[] = [];
  
  // Search users
  if (types.includes('user')) {
    const userResults = await searchUsers(query, limit, includePrivate);
    results.push(...userResults);
  }
  
  // Search courses
  if (types.includes('course')) {
    const courseResults = await searchCourses(query, limit);
    results.push(...courseResults);
  }
  
  // Search professors
  if (types.includes('professor')) {
    const professorResults = await searchProfessors(query, limit);
    results.push(...professorResults);
  }
  
  // Sort by score and limit results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Search users by name, email, or other fields
 */
export async function searchUsers(
  query: string,
  limit: number = 20,
  includePrivate: boolean = false
): Promise<SearchResult[]> {
  const searchTerm = `%${query}%`;
  
  const results = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      gradYear: users.gradYear,
      degreeProgram: users.degreeProgram,
      currentRole: users.currentRole,
      location: users.location,
      role: users.role,
    })
    .from(users)
    .where(
      or(
        ilike(users.firstName, searchTerm),
        ilike(users.lastName, searchTerm),
        ilike(users.email, searchTerm),
        ilike(users.currentRole, searchTerm),
        ilike(users.degreeProgram, searchTerm),
        ilike(users.location, searchTerm),
        sql`${users.firstName} || ' ' || ${users.lastName} ILIKE ${searchTerm}`
      )
    )
    .limit(limit);
  
  return results.map(user => {
    let score = 100;
    const lowerQuery = query.toLowerCase();
    const fullName = `${user.firstName} ${user.lastName}`;
    
    // Exact matches get higher scores
    if (user.email.toLowerCase() === lowerQuery) score += 50;
    if (fullName.toLowerCase() === lowerQuery) score += 40;
    
    // Partial matches
    if (user.firstName.toLowerCase().includes(lowerQuery)) score += 20;
    if (user.lastName.toLowerCase().includes(lowerQuery)) score += 20;
    if (user.email.toLowerCase().includes(lowerQuery)) score += 15;
    
    // Filter out sensitive info for non-admin searches
    const metadata: Record<string, unknown> = {
      gradYear: user.gradYear,
      degreeProgram: user.degreeProgram,
      role: user.role,
    };
    
    if (includePrivate) {
      metadata.email = user.email;
      metadata.currentRole = user.currentRole;
      metadata.location = user.location;
    }
    
    return {
      type: 'user' as const,
      id: user.id,
      title: fullName,
      subtitle: user.role === 'admin' ? 'Administrator' : 'Head TA',
      metadata,
      score,
    };
  });
}

/**
 * Search courses by number or name
 */
export async function searchCourses(
  query: string,
  limit: number = 20
): Promise<SearchResult[]> {
  const searchTerm = `%${query}%`;
  
  // First, try to find courses with their current offerings
  const results = await db
    .select({
      id: courses.id,
      courseNumber: courses.courseNumber,
      courseName: courses.courseName,
      latestOffering: sql<string>`
        (SELECT co.semester || ' ' || co.year 
         FROM ${courseOfferings} co 
         WHERE co.course_id = ${courses.id} 
         ORDER BY co.year DESC, 
           CASE co.season 
             WHEN 'fall' THEN 3 
             WHEN 'summer' THEN 2 
             WHEN 'spring' THEN 1 
           END DESC 
         LIMIT 1)
      `.as('latestOffering'),
      taCount: sql<number>`
        (SELECT COUNT(DISTINCT ta.user_id)
         FROM ${courseOfferings} co
         JOIN ${taAssignments} ta ON ta.course_offering_id = co.id
         WHERE co.course_id = ${courses.id})
      `.as('taCount'),
    })
    .from(courses)
    .where(
      or(
        ilike(courses.courseNumber, searchTerm),
        ilike(courses.courseName, searchTerm),
        sql`${courses.courseNumber} || ' - ' || ${courses.courseName} ILIKE ${searchTerm}`
      )
    )
    .limit(limit);
  
  return results.map(course => {
    let score = 100;
    const lowerQuery = query.toLowerCase();
    
    // Exact course number match gets highest score
    if (course.courseNumber.toLowerCase() === lowerQuery) score += 60;
    
    // Course number contains query
    if (course.courseNumber.toLowerCase().includes(lowerQuery)) score += 30;
    
    // Course name matches
    if (course.courseName.toLowerCase().includes(lowerQuery)) score += 20;
    
    // Popular courses (more TAs) get slight boost
    score += Math.min(course.taCount * 2, 20);
    
    return {
      type: 'course' as const,
      id: course.id,
      title: `${course.courseNumber} - ${course.courseName}`,
      subtitle: course.latestOffering ? `Last offered: ${course.latestOffering}` : 'Not recently offered',
      metadata: {
        courseNumber: course.courseNumber,
        totalTAs: course.taCount,
      },
      score,
    };
  });
}

/**
 * Search professors by name or email
 */
export async function searchProfessors(
  query: string,
  limit: number = 20
): Promise<SearchResult[]> {
  const searchTerm = `%${query}%`;
  
  const results = await db
    .select({
      id: professors.id,
      firstName: professors.firstName,
      lastName: professors.lastName,
      email: professors.email,
      courseCount: sql<number>`
        COUNT(DISTINCT ${courseOfferings.id})
      `.as('courseCount'),
      latestCourse: sql<string>`
        (SELECT c.course_number || ' - ' || c.course_name
         FROM ${courseOfferings} co
         JOIN ${courses} c ON c.id = co.course_id
         WHERE co.professor_id = ${professors.id}
         ORDER BY co.year DESC, 
           CASE co.season 
             WHEN 'fall' THEN 3 
             WHEN 'summer' THEN 2 
             WHEN 'spring' THEN 1 
           END DESC
         LIMIT 1)
      `.as('latestCourse'),
    })
    .from(professors)
    .leftJoin(courseOfferings, eq(courseOfferings.professorId, professors.id))
    .where(
      or(
        ilike(professors.firstName, searchTerm),
        ilike(professors.lastName, searchTerm),
        ilike(professors.email, searchTerm),
        sql`${professors.firstName} || ' ' || ${professors.lastName} ILIKE ${searchTerm}`
      )
    )
    .groupBy(professors.id)
    .limit(limit);
  
  return results.map(professor => {
    let score = 100;
    const lowerQuery = query.toLowerCase();
    const fullName = `${professor.firstName} ${professor.lastName}`;
    
    // Exact matches get higher scores
    if (professor.email.toLowerCase() === lowerQuery) score += 50;
    if (fullName.toLowerCase() === lowerQuery) score += 40;
    
    // Partial matches
    if (professor.firstName.toLowerCase().includes(lowerQuery)) score += 20;
    if (professor.lastName.toLowerCase().includes(lowerQuery)) score += 20;
    
    // Active professors get a boost
    score += Math.min(professor.courseCount * 3, 30);
    
    return {
      type: 'professor' as const,
      id: professor.id,
      title: fullName,
      subtitle: professor.latestCourse || 'No courses assigned',
      metadata: {
        email: professor.email,
        totalCourses: professor.courseCount,
      },
      score,
    };
  });
}

/**
 * Get search suggestions based on partial input
 */
export async function getSearchSuggestions(
  partialQuery: string,
  type?: 'user' | 'course' | 'professor',
  limit: number = 5
): Promise<string[]> {
  if (partialQuery.length < 2) return [];
  
  const suggestions: string[] = [];
  const searchTerm = `${partialQuery}%`;
  
  if (!type || type === 'course') {
    const courseSuggestions = await db
      .select({
        suggestion: sql<string>`DISTINCT ${courses.courseNumber}`.as('suggestion'),
      })
      .from(courses)
      .where(ilike(courses.courseNumber, searchTerm))
      .limit(limit);
    
    suggestions.push(...courseSuggestions.map(c => c.suggestion));
  }
  
  if (!type || type === 'user') {
    const userSuggestions = await db
      .select({
        suggestion: sql<string>`DISTINCT ${users.firstName} || ' ' || ${users.lastName}`.as('suggestion'),
      })
      .from(users)
      .where(
        or(
          ilike(users.firstName, searchTerm),
          ilike(users.lastName, searchTerm)
        )
      )
      .limit(limit);
    
    suggestions.push(...userSuggestions.map(u => u.suggestion));
  }
  
  if (!type || type === 'professor') {
    const professorSuggestions = await db
      .select({
        suggestion: sql<string>`DISTINCT ${professors.firstName} || ' ' || ${professors.lastName}`.as('suggestion'),
      })
      .from(professors)
      .where(
        or(
          ilike(professors.firstName, searchTerm),
          ilike(professors.lastName, searchTerm)
        )
      )
      .limit(limit);
    
    suggestions.push(...professorSuggestions.map(p => p.suggestion));
  }
  
  return Array.from(new Set(suggestions)).slice(0, limit);
}

/**
 * Search all entities and return them in a simple format for the search page
 */
export async function searchAll(query: string) {
  const searchTerm = `%${query}%`;
  
  // Search users
  const userResults = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      gradYear: users.gradYear,
    })
    .from(users)
    .where(
      or(
        ilike(users.firstName, searchTerm),
        ilike(users.lastName, searchTerm),
        ilike(users.email, searchTerm),
        sql`${users.firstName} || ' ' || ${users.lastName} ILIKE ${searchTerm}`
      )
    )
    .limit(20);
  
  // Search courses
  const courseResults = await db
    .select({
      id: courses.id,
      courseNumber: courses.courseNumber,
      courseName: courses.courseName,
    })
    .from(courses)
    .where(
      or(
        ilike(courses.courseNumber, searchTerm),
        ilike(courses.courseName, searchTerm)
      )
    )
    .limit(20);
  
  // Search professors
  const professorResults = await db
    .select({
      id: professors.id,
      firstName: professors.firstName,
      lastName: professors.lastName,
      email: professors.email,
    })
    .from(professors)
    .where(
      or(
        ilike(professors.firstName, searchTerm),
        ilike(professors.lastName, searchTerm),
        ilike(professors.email, searchTerm),
        sql`${professors.firstName} || ' ' || ${professors.lastName} ILIKE ${searchTerm}`
      )
    )
    .limit(20);
  
  return {
    users: userResults,
    courses: courseResults,
    professors: professorResults,
  };
}