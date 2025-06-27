import { eq, or, asc, like, count, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { courses, courseOfferings, taAssignments } from '@/lib/db/schema';
import { cache, cacheKeys, cacheTTL } from '@/lib/cache';
import { withTimeoutFallback } from '@/lib/db/query-timeout';
import type {
  Course,
  CourseWithRelations,
  CreateCourseInput,
  CourseOffering,
} from '@/lib/types';

export class CourseRepository {
  /**
   * Find a course by ID
   */
  async findById(id: string): Promise<Course | null> {
    return cache.getOrSet(
      cacheKeys.course(id),
      async () => {
        try {
          const result = await db.select()
            .from(courses)
            .where(eq(courses.id, id))
            .limit(1);
          
          return result[0] || null;
        } catch (error) {
          console.error('Error finding course by ID:', error);
          throw new Error('Failed to find course');
        }
      },
      cacheTTL.long
    );
  }

  /**
   * Find a course by course number
   */
  async findByCourseNumber(courseNumber: string): Promise<Course | null> {
    return cache.getOrSet(
      cacheKeys.courseByNumber(courseNumber),
      async () => {
        try {
          const result = await db.select()
            .from(courses)
            .where(eq(courses.courseNumber, courseNumber))
            .limit(1);
          
          return result[0] || null;
        } catch (error) {
          console.error('Error finding course by course number:', error);
          throw new Error('Failed to find course');
        }
      },
      cacheTTL.long
    );
  }

  /**
   * Find all courses with optional filters
   */
  async findAll(): Promise<Course[]> {
    try {
      const queryBuilder = db.select().from(courses);
      
      // Remove offeringPattern filter - will be determined by actual offerings
      
      const query = queryBuilder.orderBy(asc(courses.courseNumber));
      const result = await withTimeoutFallback(query, [], 5000, 'CourseRepository.findAll');
      
      return result;
    } catch (error) {
      console.error('Error finding all courses:', error);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Create a new course
   */
  async create(input: CreateCourseInput): Promise<Course> {
    try {
      const result = await db.insert(courses)
        .values(input)
        .returning();
      
      if (!result[0]) {
        throw new Error('Failed to create course');
      }
      
      // Invalidate related caches
      cache.delete(cacheKeys.courseList());
      cache.clearPattern(/^search:.*course/);
      
      return result[0];
    } catch (error) {
      console.error('Error creating course:', error);
      if (error instanceof Error && error.message.includes('unique')) {
        throw new Error('Course with this number already exists');
      }
      throw new Error('Failed to create course');
    }
  }

  /**
   * Update a course
   */
  async update(id: string, input: Partial<CreateCourseInput>): Promise<Course> {
    try {
      const result = await db.update(courses)
        .set(input)
        .where(eq(courses.id, id))
        .returning();
      
      if (!result[0]) {
        throw new Error('Course not found');
      }
      
      // Invalidate related caches
      cache.delete(cacheKeys.course(id));
      cache.delete(cacheKeys.courseList());
      if (result[0].courseNumber) {
        cache.delete(cacheKeys.courseByNumber(result[0].courseNumber));
      }
      cache.clearPattern(/^search:.*course/);
      
      return result[0];
    } catch (error) {
      console.error('Error updating course:', error);
      if (error instanceof Error && error.message.includes('unique')) {
        throw new Error('Course with this number already exists');
      }
      throw new Error('Failed to update course');
    }
  }

  /**
   * Delete a course
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete(courses)
        .where(eq(courses.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw new Error('Failed to delete course');
    }
  }

  /**
   * Find course with relations
   */
  async findWithRelations(id: string): Promise<CourseWithRelations | null> {
    try {
      const result = await db.query.courses.findFirst({
        where: eq(courses.id, id),
        with: {
          offerings: {
            with: {
              professor: true,
              taAssignments: {
                with: {
                  user: true,
                },
              },
            },
            orderBy: (offerings, { desc }) => [desc(offerings.year), desc(offerings.season)],
          },
        },
      });
      
      if (!result) return null;
      
      return result as CourseWithRelations;
    } catch (error) {
      console.error('Error finding course with relations:', error);
      throw new Error('Failed to find course');
    }
  }

  /**
   * Search courses by name or number
   */
  async search(query: string): Promise<Course[]> {
    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      
      const searchQuery = db.select()
        .from(courses)
        .where(
          or(
            like(courses.courseNumber, searchTerm),
            like(courses.courseName, searchTerm)
          )
        )
        .orderBy(asc(courses.courseNumber))
        .limit(50);
      
      const result = await withTimeoutFallback(searchQuery, [], 5000, 'CourseRepository.search');
      
      return result;
    } catch (error) {
      console.error('Error searching courses:', error);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Count courses by filters
   */
  async count(): Promise<number> {
    try {
      const queryBuilder = db.select({ count: count() }).from(courses);
      
      // Remove offeringPattern filter - will be determined by actual offerings
      
      const result = await queryBuilder;
      return Number(result[0]?.count) || 0;
    } catch (error) {
      console.error('Error counting courses:', error);
      throw new Error('Failed to count courses');
    }
  }

  // Removed findByOfferingPattern - offering patterns should be determined from actual offerings

  /**
   * Batch create courses
   */
  async createBatch(inputs: CreateCourseInput[]): Promise<Course[]> {
    try {
      const result = await db.insert(courses)
        .values(inputs)
        .returning();
      
      return result;
    } catch (error) {
      console.error('Error batch creating courses:', error);
      if (error instanceof Error && error.message.includes('unique')) {
        throw new Error('One or more courses already exist');
      }
      throw new Error('Failed to create courses');
    }
  }

  /**
   * Find all courses with their offerings and TA counts in a single optimized query
   */
  async findAllWithOfferingsAndTACounts(): Promise<Array<Course & { offerings: Array<CourseOffering & { taCount: number }> }>> {
    try {
      // First, get all courses with their offerings in one query
      const coursesWithOfferings = await db
        .select({
          courseId: courses.id,
          courseNumber: courses.courseNumber,
          courseName: courses.courseName,
          courseCreatedAt: courses.createdAt,
          offeringId: courseOfferings.id,
          offeringProfessorId: courseOfferings.professorId,
          offeringSemester: courseOfferings.semester,
          offeringYear: courseOfferings.year,
          offeringSeason: courseOfferings.season,
          offeringCreatedAt: courseOfferings.createdAt,
        })
        .from(courses)
        .leftJoin(courseOfferings, eq(courses.id, courseOfferings.courseId))
        .orderBy(asc(courses.courseNumber));

      // Get TA counts for all offerings in one query
      const offeringIds = coursesWithOfferings
        .filter(row => row.offeringId !== null)
        .map(row => row.offeringId as string);

      let taCounts: Record<string, number> = {};
      if (offeringIds.length > 0) {
        const taCountResults = await db
          .select({
            courseOfferingId: taAssignments.courseOfferingId,
            count: count()
          })
          .from(taAssignments)
          .where(sql`${taAssignments.courseOfferingId} IN (${sql.join(offeringIds.map(id => sql`${id}`), sql`, `)})`)
          .groupBy(taAssignments.courseOfferingId);

        taCounts = Object.fromEntries(
          taCountResults.map(row => [row.courseOfferingId, Number(row.count)])
        );
      }

      // Group results by course
      const courseMap = new Map<string, Course & { offerings: Array<CourseOffering & { taCount: number }> }>();
      
      for (const row of coursesWithOfferings) {
        if (!courseMap.has(row.courseId)) {
          courseMap.set(row.courseId, {
            id: row.courseId,
            courseNumber: row.courseNumber,
            courseName: row.courseName,
            createdAt: row.courseCreatedAt,
            offerings: []
          });
        }

        if (row.offeringId && row.offeringSemester && row.offeringYear && row.offeringSeason && row.offeringCreatedAt) {
          const course = courseMap.get(row.courseId);
          if (course) {
            course.offerings.push({
              id: row.offeringId,
              courseId: row.courseId,
              professorId: row.offeringProfessorId ?? undefined,
              semester: row.offeringSemester,
              year: row.offeringYear,
              season: row.offeringSeason as 'Fall' | 'Spring',
              createdAt: row.offeringCreatedAt,
              taCount: taCounts[row.offeringId] || 0
            });
          }
        }
      }

      return Array.from(courseMap.values());
    } catch (error) {
      console.error('Error finding courses with offerings and TA counts:', error);
      throw new Error('Failed to find courses with details');
    }
  }
}

// Export a singleton instance
export const courseRepository = new CourseRepository();