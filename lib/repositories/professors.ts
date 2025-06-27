import { eq, and, or, asc, like, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { professors } from '@/lib/db/schema';
import { withTimeoutFallback } from '@/lib/db/query-timeout';
import type {
  Professor,
  Course,
  CreateProfessorInput,
} from '@/lib/types';

export class ProfessorRepository {
  /**
   * Find a professor by ID
   */
  async findById(id: string): Promise<Professor | null> {
    try {
      const result = await db.select()
        .from(professors)
        .where(eq(professors.id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error finding professor by ID:', error);
      throw new Error('Failed to find professor');
    }
  }

  /**
   * Find a professor by email
   */
  async findByEmail(email: string): Promise<Professor | null> {
    try {
      const result = await db.select()
        .from(professors)
        .where(eq(professors.email, email.toLowerCase()))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error finding professor by email:', error);
      throw new Error('Failed to find professor');
    }
  }

  /**
   * Find all professors
   */
  async findAll(): Promise<Professor[]> {
    try {
      const query = db.select()
        .from(professors)
        .orderBy(asc(professors.lastName), asc(professors.firstName));
      
      const result = await withTimeoutFallback(query, [], 5000, 'ProfessorRepository.findAll');
      return result;
    } catch (error) {
      console.error('Error finding all professors:', error);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Create a new professor
   */
  async create(input: CreateProfessorInput): Promise<Professor> {
    try {
      const result = await db.insert(professors)
        .values({
          ...input,
          email: input.email.toLowerCase(),
        })
        .returning();
      
      if (!result[0]) {
        throw new Error('Failed to create professor');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error creating professor:', error);
      if (error instanceof Error && error.message.includes('unique')) {
        throw new Error('Professor with this email already exists');
      }
      throw new Error('Failed to create professor');
    }
  }

  /**
   * Update a professor
   */
  async update(id: string, input: Partial<CreateProfessorInput>): Promise<Professor> {
    try {
      const updateData: Partial<CreateProfessorInput> = { ...input };
      if (input.email) {
        updateData.email = input.email.toLowerCase();
      }
      
      const result = await db.update(professors)
        .set(updateData)
        .where(eq(professors.id, id))
        .returning();
      
      if (!result[0]) {
        throw new Error('Professor not found');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error updating professor:', error);
      if (error instanceof Error && error.message.includes('unique')) {
        throw new Error('Professor with this email already exists');
      }
      throw new Error('Failed to update professor');
    }
  }

  /**
   * Delete a professor
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete(professors)
        .where(eq(professors.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting professor:', error);
      throw new Error('Failed to delete professor');
    }
  }

  /**
   * Find professor with their course offerings
   */
  async findWithCourseOfferings(id: string): Promise<Professor & { courseOfferings: Array<{ course: Course; year: number; season: string; id: string; courseId: string; professorId?: string; semester: string; updatedBy?: string; createdAt: Date }> } | null> {
    try {
      const result = await db.query.professors.findFirst({
        where: eq(professors.id, id),
        with: {
          courseOfferings: {
            with: {
              course: true,
            },
            orderBy: (offerings, { desc }) => [desc(offerings.year), desc(offerings.season)],
          },
        },
      });
      
      if (!result) return null;
      
      // Type assertion with proper mapping
      return {
        id: result.id,
        firstName: result.firstName,
        lastName: result.lastName,
        email: result.email,
        createdAt: result.createdAt,
        courseOfferings: result.courseOfferings.map(offering => ({
          id: offering.id,
          courseId: offering.courseId,
          professorId: offering.professorId || undefined,
          semester: offering.semester,
          year: offering.year,
          season: offering.season as 'Fall' | 'Spring',
          updatedBy: offering.updatedBy || undefined,
          createdAt: offering.createdAt,
          course: {
            id: offering.course.id,
            courseNumber: offering.course.courseNumber,
            courseName: offering.course.courseName,
            createdAt: offering.course.createdAt
          }
        }))
      };
    } catch (error) {
      console.error('Error finding professor with course offerings:', error);
      throw new Error('Failed to find professor');
    }
  }

  /**
   * Search professors by name or email
   */
  async search(query: string): Promise<Professor[]> {
    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      
      const result = await db.select()
        .from(professors)
        .where(
          or(
            like(professors.email, searchTerm),
            like(professors.firstName, searchTerm),
            like(professors.lastName, searchTerm)
          )
        )
        .orderBy(asc(professors.lastName), asc(professors.firstName))
        .limit(50);
      
      return result;
    } catch (error) {
      console.error('Error searching professors:', error);
      throw new Error('Failed to search professors');
    }
  }

  /**
   * Count total professors
   */
  async count(): Promise<number> {
    try {
      const result = await db.select({ count: count() })
        .from(professors);
      
      return Number(result[0]?.count) || 0;
    } catch (error) {
      console.error('Error counting professors:', error);
      throw new Error('Failed to count professors');
    }
  }

  /**
   * Find professors by name
   */
  async findByName(firstName: string, lastName: string): Promise<Professor[]> {
    try {
      const result = await db.select()
        .from(professors)
        .where(
          and(
            eq(professors.firstName, firstName),
            eq(professors.lastName, lastName)
          )
        );
      
      return result;
    } catch (error) {
      console.error('Error finding professors by name:', error);
      throw new Error('Failed to find professors');
    }
  }

  /**
   * Batch create professors
   */
  async createBatch(inputs: CreateProfessorInput[]): Promise<Professor[]> {
    try {
      const normalizedInputs = inputs.map(input => ({
        ...input,
        email: input.email.toLowerCase(),
      }));
      
      const result = await db.insert(professors)
        .values(normalizedInputs)
        .returning();
      
      return result;
    } catch (error) {
      console.error('Error batch creating professors:', error);
      if (error instanceof Error && error.message.includes('unique')) {
        throw new Error('One or more professors already exist');
      }
      throw new Error('Failed to create professors');
    }
  }

  /**
   * Get professors with course count
   */
  async findAllWithCourseCount(): Promise<(Professor & { courseCount: number })[]> {
    try {
      const professorsWithCourses = await db.query.professors.findMany({
        with: {
          courseOfferings: true,
        },
        orderBy: [asc(professors.lastName), asc(professors.firstName)],
      });
      
      return professorsWithCourses.map(prof => ({
        id: prof.id,
        firstName: prof.firstName,
        lastName: prof.lastName,
        email: prof.email,
        createdAt: prof.createdAt,
        courseCount: Array.isArray(prof.courseOfferings) ? prof.courseOfferings.length : 0,
      }));
    } catch (error) {
      console.error('Error finding professors with course count:', error);
      throw new Error('Failed to find professors');
    }
  }

  /**
   * Check if a professor exists
   */
  async exists(email: string): Promise<boolean> {
    try {
      const result = await db.select({ id: professors.id })
        .from(professors)
        .where(eq(professors.email, email.toLowerCase()))
        .limit(1);
      
      return result.length > 0;
    } catch (error) {
      console.error('Error checking professor existence:', error);
      throw new Error('Failed to check professor');
    }
  }
}

// Export a singleton instance
export const professorRepository = new ProfessorRepository();