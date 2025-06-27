import { eq, and, desc, asc, count, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { taAssignments, courseOfferings } from '@/lib/db/schema';
import { withTimeoutFallback } from '@/lib/db/query-timeout';
import type {
  TAAssignment,
  TAAssignmentWithRelations,
  CreateTAAssignmentInput,
  TAAssignmentFilters,
  User,
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
      
      if (!result[0]) return null;
      return {
        ...result[0],
        hoursPerWeek: result[0].hoursPerWeek || undefined,
        responsibilities: result[0].responsibilities || undefined,
      };
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
      let queryBuilder = db.select().from(taAssignments);
      
      if (filters) {
        const conditions = [];
        
        if (filters.userId) {
          conditions.push(eq(taAssignments.userId, filters.userId));
        }
        
        if (filters.courseOfferingId) {
          conditions.push(eq(taAssignments.courseOfferingId, filters.courseOfferingId));
        }
        
        if (conditions.length > 0) {
          queryBuilder = queryBuilder.where(and(...conditions)) as typeof queryBuilder;
        }
      }
      
      const result = await queryBuilder.orderBy(desc(taAssignments.createdAt));
      return result.map(row => ({
        ...row,
        hoursPerWeek: row.hoursPerWeek || undefined,
        responsibilities: row.responsibilities || undefined,
      }));
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
      
      return result.map(row => ({
        ...row,
        hoursPerWeek: row.hoursPerWeek || undefined,
        responsibilities: row.responsibilities || undefined,
      }));
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
      
      return result.map(row => ({
        ...row,
        hoursPerWeek: row.hoursPerWeek || undefined,
        responsibilities: row.responsibilities || undefined,
      }));
    } catch (error) {
      console.error('Error finding TA assignments by course offering:', error);
      throw new Error('Failed to find TA assignments');
    }
  }

  /**
   * Find TA assignments by multiple course offering IDs
   */
  async findByCourseOfferingIds(courseOfferingIds: string[]): Promise<TAAssignment[]> {
    try {
      if (courseOfferingIds.length === 0) {
        return [];
      }
      
      const query = db.select()
        .from(taAssignments)
        .where(inArray(taAssignments.courseOfferingId, courseOfferingIds))
        .orderBy(asc(taAssignments.courseOfferingId), asc(taAssignments.userId));
      
      const result = await withTimeoutFallback(query, [], 5000, 'TAAssignmentRepository.findByCourseOfferingIds');
      
      return result.map(row => ({
        ...row,
        hoursPerWeek: row.hoursPerWeek || undefined,
        responsibilities: row.responsibilities || undefined,
      }));
    } catch (error) {
      console.error('Error finding TA assignments by course offering IDs:', error);
      return []; // Return empty array instead of throwing
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
        where: (taAssignmentsTable, { exists: existsFn }) =>
          existsFn(
            db.select()
              .from(courseOfferings)
              .where(
                and(
                  eq(courseOfferings.id, taAssignmentsTable.courseOfferingId),
                  eq(courseOfferings.semester, semester)
                )
              )
          ),
        orderBy: [asc(taAssignments.userId)],
      });
      
      return result.map(assignment => ({
        id: assignment.id,
        userId: assignment.userId,
        courseOfferingId: assignment.courseOfferingId,
        hoursPerWeek: assignment.hoursPerWeek || undefined,
        responsibilities: assignment.responsibilities || undefined,
        createdAt: assignment.createdAt,
        user: assignment.user ? {
          id: (assignment.user as User).id,
          email: (assignment.user as User).email,
          firstName: (assignment.user as User).firstName,
          lastName: (assignment.user as User).lastName,
          gradYear: (assignment.user as User).gradYear || undefined,
          degreeProgram: (assignment.user as User).degreeProgram || undefined,
          currentRole: (assignment.user as User).currentRole || undefined,
          linkedinUrl: (assignment.user as User).linkedinUrl || undefined,
          personalSite: (assignment.user as User).personalSite || undefined,
          location: (assignment.user as User).location || undefined,
          role: (assignment.user as User).role as 'head_ta' | 'admin',
          invitedBy: (assignment.user as User).invitedBy || undefined,
          createdAt: (assignment.user as User).createdAt,
          updatedAt: (assignment.user as User).updatedAt
        } : undefined,
        courseOffering: assignment.courseOffering ? {
          id: assignment.courseOffering.id,
          courseId: assignment.courseOffering.courseId,
          professorId: assignment.courseOffering.professorId || undefined,
          semester: assignment.courseOffering.semester,
          year: assignment.courseOffering.year,
          season: assignment.courseOffering.season as 'Fall' | 'Spring',
          updatedBy: assignment.courseOffering.updatedBy || undefined,
          createdAt: assignment.courseOffering.createdAt,
          course: assignment.courseOffering.course ? {
            id: assignment.courseOffering.course.id,
            courseNumber: assignment.courseOffering.course.courseNumber,
            courseName: assignment.courseOffering.course.courseName,
            createdAt: assignment.courseOffering.course.createdAt
          } : undefined,
          professor: assignment.courseOffering.professor ? {
            id: assignment.courseOffering.professor.id,
            firstName: assignment.courseOffering.professor.firstName,
            lastName: assignment.courseOffering.professor.lastName,
            email: assignment.courseOffering.professor.email,
            createdAt: assignment.courseOffering.professor.createdAt
          } : undefined
        } : undefined
      } as TAAssignmentWithRelations));
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
      
      return {
        ...result[0],
        hoursPerWeek: result[0].hoursPerWeek || undefined,
        responsibilities: result[0].responsibilities || undefined,
      };
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
      
      return {
        ...result[0],
        hoursPerWeek: result[0].hoursPerWeek || undefined,
        responsibilities: result[0].responsibilities || undefined,
      };
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
      
      if (!result) return null;
      
      return {
        id: result.id,
        userId: result.userId,
        courseOfferingId: result.courseOfferingId,
        hoursPerWeek: result.hoursPerWeek || undefined,
        responsibilities: result.responsibilities || undefined,
        createdAt: result.createdAt,
        user: result.user ? {
          id: (result.user as User).id,
          email: (result.user as User).email,
          firstName: (result.user as User).firstName,
          lastName: (result.user as User).lastName,
          gradYear: (result.user as User).gradYear || undefined,
          degreeProgram: (result.user as User).degreeProgram || undefined,
          currentRole: (result.user as User).currentRole || undefined,
          linkedinUrl: (result.user as User).linkedinUrl || undefined,
          personalSite: (result.user as User).personalSite || undefined,
          location: (result.user as User).location || undefined,
          role: (result.user as User).role as 'head_ta' | 'admin',
          invitedBy: (result.user as User).invitedBy || undefined,
          createdAt: (result.user as User).createdAt,
          updatedAt: (result.user as User).updatedAt
        } : undefined,
        courseOffering: result.courseOffering ? {
          id: result.courseOffering.id,
          courseId: result.courseOffering.courseId,
          professorId: result.courseOffering.professorId || undefined,
          semester: result.courseOffering.semester,
          year: result.courseOffering.year,
          season: result.courseOffering.season as 'Fall' | 'Spring',
          updatedBy: result.courseOffering.updatedBy || undefined,
          createdAt: result.courseOffering.createdAt,
          course: result.courseOffering.course ? {
            id: result.courseOffering.course.id,
            courseNumber: result.courseOffering.course.courseNumber,
            courseName: result.courseOffering.course.courseName,
            createdAt: result.courseOffering.course.createdAt
          } : undefined,
          professor: result.courseOffering.professor ? {
            id: result.courseOffering.professor.id,
            firstName: result.courseOffering.professor.firstName,
            lastName: result.courseOffering.professor.lastName,
            email: result.courseOffering.professor.email,
            createdAt: result.courseOffering.professor.createdAt
          } : undefined
        } : undefined
      } as TAAssignmentWithRelations;
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
      
      return result.map(assignment => ({
        id: assignment.id,
        userId: assignment.userId,
        courseOfferingId: assignment.courseOfferingId,
        hoursPerWeek: assignment.hoursPerWeek || undefined,
        responsibilities: assignment.responsibilities || undefined,
        createdAt: assignment.createdAt,
        courseOffering: assignment.courseOffering ? {
          id: assignment.courseOffering.id,
          courseId: assignment.courseOffering.courseId,
          professorId: assignment.courseOffering.professorId || undefined,
          semester: assignment.courseOffering.semester,
          year: assignment.courseOffering.year,
          season: assignment.courseOffering.season as 'Fall' | 'Spring',
          updatedBy: assignment.courseOffering.updatedBy || undefined,
          createdAt: assignment.courseOffering.createdAt,
          course: assignment.courseOffering.course ? {
            id: assignment.courseOffering.course.id,
            courseNumber: assignment.courseOffering.course.courseNumber,
            courseName: assignment.courseOffering.course.courseName,
            createdAt: assignment.courseOffering.course.createdAt
          } : undefined,
          professor: assignment.courseOffering.professor ? {
            id: assignment.courseOffering.professor.id,
            firstName: assignment.courseOffering.professor.firstName,
            lastName: assignment.courseOffering.professor.lastName,
            email: assignment.courseOffering.professor.email,
            createdAt: assignment.courseOffering.professor.createdAt
          } : undefined
        } : undefined
      } as TAAssignmentWithRelations));
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
      
      if (!result[0]) return null;
      return {
        ...result[0],
        hoursPerWeek: result[0].hoursPerWeek || undefined,
        responsibilities: result[0].responsibilities || undefined,
      };
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
      const result = await db.select({ count: count() })
        .from(taAssignments)
        .where(eq(taAssignments.userId, userId));
      
      return Number(result[0]?.count) || 0;
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
      const result = await db.select({ count: count() })
        .from(taAssignments)
        .where(eq(taAssignments.courseOfferingId, courseOfferingId));
      
      return Number(result[0]?.count) || 0;
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
      
      return result.map(row => ({
        ...row,
        hoursPerWeek: row.hoursPerWeek || undefined,
        responsibilities: row.responsibilities || undefined,
      }));
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

  /**
   * Count total TA assignments
   */
  async count(): Promise<number> {
    try {
      const result = await db.select({ count: count() })
        .from(taAssignments);
      
      return Number(result[0]?.count) || 0;
    } catch (error) {
      console.error('Error counting TA assignments:', error);
      throw new Error('Failed to count TA assignments');
    }
  }
}

// Export a singleton instance
export const taAssignmentRepository = new TAAssignmentRepository();