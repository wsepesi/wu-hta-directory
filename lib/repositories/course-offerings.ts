import { eq, and, or, desc, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { courseOfferings } from '@/lib/db/schema';
import type {
  CourseOffering,
  CourseOfferingWithRelations,
  CreateCourseOfferingInput,
} from '@/lib/types';

export class CourseOfferingRepository {
  /**
   * Find a course offering by ID
   */
  async findById(id: string): Promise<CourseOffering | null> {
    try {
      const result = await db.select()
        .from(courseOfferings)
        .where(eq(courseOfferings.id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error finding course offering by ID:', error);
      throw new Error('Failed to find course offering');
    }
  }

  /**
   * Find all course offerings with optional filters
   */
  async findAll(): Promise<CourseOffering[]> {
    try {
      const result = await db.select()
        .from(courseOfferings)
        .orderBy(desc(courseOfferings.year), desc(courseOfferings.season));
      
      return result;
    } catch (error) {
      console.error('Error finding all course offerings:', error);
      throw new Error('Failed to find course offerings');
    }
  }

  /**
   * Find course offerings by semester
   */
  async findBySemester(semester: string): Promise<CourseOffering[]> {
    try {
      const result = await db.select()
        .from(courseOfferings)
        .where(eq(courseOfferings.semester, semester))
        .orderBy(asc(courseOfferings.courseId));
      
      return result;
    } catch (error) {
      console.error('Error finding course offerings by semester:', error);
      throw new Error('Failed to find course offerings');
    }
  }

  /**
   * Find course offerings by course ID
   */
  async findByCourseId(courseId: string): Promise<CourseOffering[]> {
    try {
      const result = await db.select()
        .from(courseOfferings)
        .where(eq(courseOfferings.courseId, courseId))
        .orderBy(desc(courseOfferings.year), desc(courseOfferings.season));
      
      return result;
    } catch (error) {
      console.error('Error finding course offerings by course:', error);
      throw new Error('Failed to find course offerings');
    }
  }

  /**
   * Find course offerings by professor ID
   */
  async findByProfessorId(professorId: string): Promise<CourseOffering[]> {
    try {
      const result = await db.select()
        .from(courseOfferings)
        .where(eq(courseOfferings.professorId, professorId))
        .orderBy(desc(courseOfferings.year), desc(courseOfferings.season));
      
      return result;
    } catch (error) {
      console.error('Error finding course offerings by professor:', error);
      throw new Error('Failed to find course offerings');
    }
  }

  /**
   * Find course offerings by year and season
   */
  async findByYearAndSeason(year: number, season: 'Fall' | 'Spring'): Promise<CourseOffering[]> {
    try {
      const result = await db.select()
        .from(courseOfferings)
        .where(
          and(
            eq(courseOfferings.year, year),
            eq(courseOfferings.season, season)
          )
        )
        .orderBy(asc(courseOfferings.courseId));
      
      return result;
    } catch (error) {
      console.error('Error finding course offerings by year and season:', error);
      throw new Error('Failed to find course offerings');
    }
  }

  /**
   * Create a new course offering
   */
  async create(input: CreateCourseOfferingInput): Promise<CourseOffering> {
    try {
      const result = await db.insert(courseOfferings)
        .values(input)
        .returning();
      
      if (!result[0]) {
        throw new Error('Failed to create course offering');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error creating course offering:', error);
      throw new Error('Failed to create course offering');
    }
  }

  /**
   * Update a course offering
   */
  async update(id: string, input: Partial<CreateCourseOfferingInput> & { updatedBy?: string }): Promise<CourseOffering> {
    try {
      const result = await db.update(courseOfferings)
        .set(input)
        .where(eq(courseOfferings.id, id))
        .returning();
      
      if (!result[0]) {
        throw new Error('Course offering not found');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error updating course offering:', error);
      throw new Error('Failed to update course offering');
    }
  }

  /**
   * Delete a course offering
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete(courseOfferings)
        .where(eq(courseOfferings.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting course offering:', error);
      throw new Error('Failed to delete course offering');
    }
  }

  /**
   * Find course offering with relations
   */
  async findWithRelations(id: string): Promise<CourseOfferingWithRelations | null> {
    try {
      const result = await db.query.courseOfferings.findFirst({
        where: eq(courseOfferings.id, id),
        with: {
          course: true,
          professor: true,
          taAssignments: {
            with: {
              user: true,
            },
          },
        },
      });
      
      return result || null;
    } catch (error) {
      console.error('Error finding course offering with relations:', error);
      throw new Error('Failed to find course offering');
    }
  }

  /**
   * Find all course offerings with relations for a specific semester
   */
  async findBySemesterWithRelations(semester: string): Promise<CourseOfferingWithRelations[]> {
    try {
      const result = await db.query.courseOfferings.findMany({
        where: eq(courseOfferings.semester, semester),
        with: {
          course: true,
          professor: true,
          taAssignments: {
            with: {
              user: true,
            },
          },
        },
        orderBy: [asc(courseOfferings.courseId)],
      });
      
      return result;
    } catch (error) {
      console.error('Error finding course offerings with relations:', error);
      throw new Error('Failed to find course offerings');
    }
  }

  /**
   * Check if a course offering exists
   */
  async exists(courseId: string, year: number, season: 'Fall' | 'Spring'): Promise<boolean> {
    try {
      const result = await db.select({ id: courseOfferings.id })
        .from(courseOfferings)
        .where(
          and(
            eq(courseOfferings.courseId, courseId),
            eq(courseOfferings.year, year),
            eq(courseOfferings.season, season)
          )
        )
        .limit(1);
      
      return result.length > 0;
    } catch (error) {
      console.error('Error checking course offering existence:', error);
      throw new Error('Failed to check course offering');
    }
  }

  /**
   * Get distinct semesters
   */
  async getDistinctSemesters(): Promise<string[]> {
    try {
      const result = await db.selectDistinct({ semester: courseOfferings.semester })
        .from(courseOfferings)
        .orderBy(desc(courseOfferings.year), desc(courseOfferings.season));
      
      return result.map(row => row.semester);
    } catch (error) {
      console.error('Error getting distinct semesters:', error);
      throw new Error('Failed to get semesters');
    }
  }

  /**
   * Count course offerings by course
   */
  async countByCourse(courseId: string): Promise<number> {
    try {
      const result = await db.select({ count: courseOfferings.id })
        .from(courseOfferings)
        .where(eq(courseOfferings.courseId, courseId));
      
      return result.length;
    } catch (error) {
      console.error('Error counting course offerings:', error);
      throw new Error('Failed to count course offerings');
    }
  }

  /**
   * Batch create course offerings
   */
  async createBatch(inputs: CreateCourseOfferingInput[]): Promise<CourseOffering[]> {
    try {
      const result = await db.insert(courseOfferings)
        .values(inputs)
        .returning();
      
      return result;
    } catch (error) {
      console.error('Error batch creating course offerings:', error);
      throw new Error('Failed to create course offerings');
    }
  }

  /**
   * Find all course offerings with relations
   */
  async findAllWithRelations(): Promise<CourseOfferingWithRelations[]> {
    try {
      const result = await db.query.courseOfferings.findMany({
        with: {
          course: true,
          professor: true,
          taAssignments: {
            with: {
              user: true,
            },
          },
        },
        orderBy: [desc(courseOfferings.year), desc(courseOfferings.season)],
      });
      
      return result;
    } catch (error) {
      console.error('Error finding all course offerings with relations:', error);
      throw new Error('Failed to find course offerings');
    }
  }

  /**
   * Find course offerings with relations by course ID
   */
  async findWithRelationsByCourseId(courseId: string): Promise<CourseOfferingWithRelations[]> {
    try {
      const result = await db.query.courseOfferings.findMany({
        where: eq(courseOfferings.courseId, courseId),
        with: {
          course: true,
          professor: true,
          taAssignments: {
            with: {
              user: true,
            },
          },
        },
        orderBy: [desc(courseOfferings.year), desc(courseOfferings.season)],
      });
      
      return result;
    } catch (error) {
      console.error('Error finding course offerings with relations by course:', error);
      throw new Error('Failed to find course offerings');
    }
  }
}

// Export a singleton instance
export const courseOfferingRepository = new CourseOfferingRepository();