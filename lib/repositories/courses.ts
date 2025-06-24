import { eq, and, or, desc, asc, like } from 'drizzle-orm';
import { db } from '@/lib/db';
import { courses } from '@/lib/db/schema';
import { cache, cacheKeys, cacheTTL } from '@/lib/cache';
import type {
  Course,
  CourseWithRelations,
  CreateCourseInput,
  CourseFilters,
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
  async findAll(filters?: CourseFilters): Promise<Course[]> {
    try {
      let query = db.select().from(courses);
      
      if (filters?.offeringPattern) {
        query = query.where(eq(courses.offeringPattern, filters.offeringPattern));
      }
      
      const result = await query.orderBy(asc(courses.courseNumber));
      return result;
    } catch (error) {
      console.error('Error finding all courses:', error);
      throw new Error('Failed to find courses');
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
      
      return result || null;
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
      
      const result = await db.select()
        .from(courses)
        .where(
          or(
            like(courses.courseNumber, searchTerm),
            like(courses.courseName, searchTerm)
          )
        )
        .orderBy(asc(courses.courseNumber))
        .limit(50);
      
      return result;
    } catch (error) {
      console.error('Error searching courses:', error);
      throw new Error('Failed to search courses');
    }
  }

  /**
   * Count courses by filters
   */
  async count(filters?: CourseFilters): Promise<number> {
    try {
      let query = db.select({ count: courses.id }).from(courses);
      
      if (filters?.offeringPattern) {
        query = query.where(eq(courses.offeringPattern, filters.offeringPattern));
      }
      
      const result = await query;
      return result.length;
    } catch (error) {
      console.error('Error counting courses:', error);
      throw new Error('Failed to count courses');
    }
  }

  /**
   * Find courses by offering pattern
   */
  async findByOfferingPattern(pattern: 'both' | 'fall_only' | 'spring_only' | 'sparse'): Promise<Course[]> {
    try {
      const result = await db.select()
        .from(courses)
        .where(eq(courses.offeringPattern, pattern))
        .orderBy(asc(courses.courseNumber));
      
      return result;
    } catch (error) {
      console.error('Error finding courses by offering pattern:', error);
      throw new Error('Failed to find courses');
    }
  }

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
}

// Export a singleton instance
export const courseRepository = new CourseRepository();