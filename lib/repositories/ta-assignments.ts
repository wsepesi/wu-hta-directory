import { eq, and, or, desc, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { taAssignments, courseOfferings } from '@/lib/db/schema';
import type {
  TAAssignment,
  TAAssignmentWithRelations,
  CreateTAAssignmentInput,
  TAAssignmentFilters,
} from '@/lib/types';

export class TAAssignmentRepository {
  /**
   * Find a TA assignment by ID
   */
  async findById(id: string): Promise<TAAssignment | null> {
    try {
      const result = await db.select()
        .from(taAssignments)
        .where(eq(taAssignments.id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error finding TA assignment by ID:', error);
      throw new Error('Failed to find TA assignment');
    }
  }

  /**
   * Find all TA assignments with optional filters
   */
  async findAll(filters?: TAAssignmentFilters): Promise<TAAssignment[]> {
    try {
      let query = db.select().from(taAssignments);
      
      if (filters) {
        const conditions = [];
        
        if (filters.userId) {
          conditions.push(eq(taAssignments.userId, filters.userId));
        }
        
        if (filters.courseOfferingId) {
          conditions.push(eq(taAssignments.courseOfferingId, filters.courseOfferingId));
        }
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
      }
      
      const result = await query.orderBy(desc(taAssignments.createdAt));
      return result;
    } catch (error) {
      console.error('Error finding all TA assignments:', error);
      throw new Error('Failed to find TA assignments');
    }
  }

  /**
   * Find TA assignments by user ID
   */
  async findByUserId(userId: string): Promise<TAAssignment[]> {
    try {
      const result = await db.select()
        .from(taAssignments)
        .where(eq(taAssignments.userId, userId))
        .orderBy(desc(taAssignments.createdAt));
      
      return result;
    } catch (error) {
      console.error('Error finding TA assignments by user:', error);
      throw new Error('Failed to find TA assignments');
    }
  }

  /**
   * Find TA assignments by course offering ID
   */
  async findByCourseOfferingId(courseOfferingId: string): Promise<TAAssignment[]> {
    try {
      const result = await db.select()
        .from(taAssignments)
        .where(eq(taAssignments.courseOfferingId, courseOfferingId))
        .orderBy(asc(taAssignments.userId));
      
      return result;
    } catch (error) {
      console.error('Error finding TA assignments by course offering:', error);
      throw new Error('Failed to find TA assignments');
    }
  }

  /**
   * Find TA assignments by semester (requires join with course offerings)
   */
  async findBySemester(semester: string): Promise<TAAssignmentWithRelations[]> {
    try {
      const result = await db.query.taAssignments.findMany({
        with: {
          user: true,
          courseOffering: {
            with: {
              course: true,
              professor: true,
            },
          },
        },
        where: (taAssignments, { eq, exists }) =>
          exists(
            db.select()
              .from(courseOfferings)
              .where(
                and(
                  eq(courseOfferings.id, taAssignments.courseOfferingId),
                  eq(courseOfferings.semester, semester)
                )
              )
          ),
        orderBy: [asc(taAssignments.userId)],
      });
      
      return result;
    } catch (error) {
      console.error('Error finding TA assignments by semester:', error);
      throw new Error('Failed to find TA assignments');
    }
  }

  /**
   * Create a new TA assignment
   */
  async create(input: CreateTAAssignmentInput): Promise<TAAssignment> {
    try {
      // Check if assignment already exists
      const existing = await this.findByUserAndCourseOffering(
        input.userId,
        input.courseOfferingId
      );
      
      if (existing) {
        throw new Error('TA assignment already exists for this user and course offering');
      }
      
      const result = await db.insert(taAssignments)
        .values(input)
        .returning();
      
      if (!result[0]) {
        throw new Error('Failed to create TA assignment');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error creating TA assignment:', error);
      if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
      }
      throw new Error('Failed to create TA assignment');
    }
  }

  /**
   * Update a TA assignment
   */
  async update(id: string, input: Partial<CreateTAAssignmentInput>): Promise<TAAssignment> {
    try {
      const result = await db.update(taAssignments)
        .set(input)
        .where(eq(taAssignments.id, id))
        .returning();
      
      if (!result[0]) {
        throw new Error('TA assignment not found');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error updating TA assignment:', error);
      throw new Error('Failed to update TA assignment');
    }
  }

  /**
   * Delete a TA assignment
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete(taAssignments)
        .where(eq(taAssignments.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting TA assignment:', error);
      throw new Error('Failed to delete TA assignment');
    }
  }

  /**
   * Find TA assignment with relations
   */
  async findWithRelations(id: string): Promise<TAAssignmentWithRelations | null> {
    try {
      const result = await db.query.taAssignments.findFirst({
        where: eq(taAssignments.id, id),
        with: {
          user: true,
          courseOffering: {
            with: {
              course: true,
              professor: true,
            },
          },
        },
      });
      
      return result || null;
    } catch (error) {
      console.error('Error finding TA assignment with relations:', error);
      throw new Error('Failed to find TA assignment');
    }
  }

  /**
   * Find TA assignments by user with relations
   */
  async findByUserIdWithRelations(userId: string): Promise<TAAssignmentWithRelations[]> {
    try {
      const result = await db.query.taAssignments.findMany({
        where: eq(taAssignments.userId, userId),
        with: {
          courseOffering: {
            with: {
              course: true,
              professor: true,
            },
          },
        },
        orderBy: [desc(taAssignments.createdAt)],
      });
      
      return result;
    } catch (error) {
      console.error('Error finding TA assignments with relations:', error);
      throw new Error('Failed to find TA assignments');
    }
  }

  /**
   * Check if a TA assignment exists for a user and course offering
   */
  async findByUserAndCourseOffering(userId: string, courseOfferingId: string): Promise<TAAssignment | null> {
    try {
      const result = await db.select()
        .from(taAssignments)
        .where(
          and(
            eq(taAssignments.userId, userId),
            eq(taAssignments.courseOfferingId, courseOfferingId)
          )
        )
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error checking TA assignment existence:', error);
      throw new Error('Failed to check TA assignment');
    }
  }

  /**
   * Count TA assignments for a user
   */
  async countByUser(userId: string): Promise<number> {
    try {
      const result = await db.select({ count: taAssignments.id })
        .from(taAssignments)
        .where(eq(taAssignments.userId, userId));
      
      return result.length;
    } catch (error) {
      console.error('Error counting TA assignments:', error);
      throw new Error('Failed to count TA assignments');
    }
  }

  /**
   * Count TA assignments for a course offering
   */
  async countByCourseOffering(courseOfferingId: string): Promise<number> {
    try {
      const result = await db.select({ count: taAssignments.id })
        .from(taAssignments)
        .where(eq(taAssignments.courseOfferingId, courseOfferingId));
      
      return result.length;
    } catch (error) {
      console.error('Error counting TA assignments:', error);
      throw new Error('Failed to count TA assignments');
    }
  }

  /**
   * Get total hours per week for a user
   */
  async getTotalHoursForUser(userId: string): Promise<number> {
    try {
      const assignments = await db.select({ hoursPerWeek: taAssignments.hoursPerWeek })
        .from(taAssignments)
        .where(eq(taAssignments.userId, userId));
      
      return assignments.reduce((total, assignment) => {
        return total + (assignment.hoursPerWeek || 0);
      }, 0);
    } catch (error) {
      console.error('Error calculating total hours:', error);
      throw new Error('Failed to calculate total hours');
    }
  }

  /**
   * Batch create TA assignments
   */
  async createBatch(inputs: CreateTAAssignmentInput[]): Promise<TAAssignment[]> {
    try {
      const result = await db.insert(taAssignments)
        .values(inputs)
        .returning();
      
      return result;
    } catch (error) {
      console.error('Error batch creating TA assignments:', error);
      throw new Error('Failed to create TA assignments');
    }
  }

  /**
   * Delete all TA assignments for a course offering
   */
  async deleteByCourseOffering(courseOfferingId: string): Promise<number> {
    try {
      const result = await db.delete(taAssignments)
        .where(eq(taAssignments.courseOfferingId, courseOfferingId))
        .returning();
      
      return result.length;
    } catch (error) {
      console.error('Error deleting TA assignments for course offering:', error);
      throw new Error('Failed to delete TA assignments');
    }
  }
}

// Export a singleton instance
export const taAssignmentRepository = new TAAssignmentRepository();