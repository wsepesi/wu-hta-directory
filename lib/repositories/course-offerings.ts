import { eq, and, desc, asc, count, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { courseOfferings } from '@/lib/db/schema';
import { withTimeoutFallback } from '@/lib/db/query-timeout';
import type {
  CourseOffering,
  CourseOfferingWithRelations,
  CreateCourseOfferingInput,
  User,
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
      
      return result[0] ? {
        id: result[0].id,
        courseId: result[0].courseId,
        professorId: result[0].professorId || undefined,
        semester: result[0].semester,
        year: result[0].year,
        season: result[0].season as 'Fall' | 'Spring',
        updatedBy: result[0].updatedBy || undefined,
        createdAt: result[0].createdAt,
      } : null;
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
      
      return result.map(row => ({
        id: row.id,
        courseId: row.courseId,
        professorId: row.professorId || undefined,
        semester: row.semester,
        year: row.year,
        season: row.season as 'Fall' | 'Spring',
        updatedBy: row.updatedBy || undefined,
        createdAt: row.createdAt,
      }));
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
      
      return result.map(row => ({
        id: row.id,
        courseId: row.courseId,
        professorId: row.professorId || undefined,
        semester: row.semester,
        year: row.year,
        season: row.season as 'Fall' | 'Spring',
        updatedBy: row.updatedBy || undefined,
        createdAt: row.createdAt,
      }));
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
      
      return result.map(row => ({
        id: row.id,
        courseId: row.courseId,
        professorId: row.professorId || undefined,
        semester: row.semester,
        year: row.year,
        season: row.season as 'Fall' | 'Spring',
        updatedBy: row.updatedBy || undefined,
        createdAt: row.createdAt,
      }));
    } catch (error) {
      console.error('Error finding course offerings by course:', error);
      throw new Error('Failed to find course offerings');
    }
  }

  /**
   * Find course offerings by multiple course IDs
   */
  async findByCourseIds(courseIds: string[]): Promise<CourseOffering[]> {
    try {
      if (courseIds.length === 0) {
        return [];
      }
      
      const query = db.select()
        .from(courseOfferings)
        .where(inArray(courseOfferings.courseId, courseIds))
        .orderBy(desc(courseOfferings.year), desc(courseOfferings.season));
      
      const result = await withTimeoutFallback(query, [], 5000, 'CourseOfferingRepository.findByCourseIds');
      
      return result.map(row => ({
        id: row.id,
        courseId: row.courseId,
        professorId: row.professorId || undefined,
        semester: row.semester,
        year: row.year,
        season: row.season as 'Fall' | 'Spring',
        updatedBy: row.updatedBy || undefined,
        createdAt: row.createdAt,
      }));
    } catch (error) {
      console.error('Error finding course offerings by course IDs:', error);
      return []; // Return empty array instead of throwing
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
      
      return result.map(row => ({
        id: row.id,
        courseId: row.courseId,
        professorId: row.professorId || undefined,
        semester: row.semester,
        year: row.year,
        season: row.season as 'Fall' | 'Spring',
        updatedBy: row.updatedBy || undefined,
        createdAt: row.createdAt,
      }));
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
      
      return result.map(row => ({
        id: row.id,
        courseId: row.courseId,
        professorId: row.professorId || undefined,
        semester: row.semester,
        year: row.year,
        season: row.season as 'Fall' | 'Spring',
        updatedBy: row.updatedBy || undefined,
        createdAt: row.createdAt,
      }));
    } catch (error) {
      console.error('Error finding course offerings by year and season:', error);
      throw new Error('Failed to find course offerings');
    }
  }

  /**
   * Create a new course offering
   */
  async create(input: CreateCourseOfferingInput): Promise<CourseOffering> {
    console.log('[COURSE_OFFERING_REPO] Creating course offering with input:', input);
    try {
      const result = await db.insert(courseOfferings)
        .values(input)
        .returning();
      
      console.log('[COURSE_OFFERING_REPO] Database insert result:', result);
      
      if (!result[0]) {
        console.error('[COURSE_OFFERING_REPO] No result returned from database insert');
        throw new Error('Failed to create course offering');
      }
      
      const created = {
        id: result[0].id,
        courseId: result[0].courseId,
        professorId: result[0].professorId || undefined,
        semester: result[0].semester,
        year: result[0].year,
        season: result[0].season as 'Fall' | 'Spring',
        updatedBy: result[0].updatedBy || undefined,
        createdAt: result[0].createdAt,
      };
      
      console.log('[COURSE_OFFERING_REPO] Successfully created course offering:', created);
      return created;
    } catch (error) {
      console.error('[COURSE_OFFERING_REPO] Error creating course offering:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        input
      });
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
      
      return {
        id: result[0].id,
        courseId: result[0].courseId,
        professorId: result[0].professorId || undefined,
        semester: result[0].semester,
        year: result[0].year,
        season: result[0].season as 'Fall' | 'Spring',
        updatedBy: result[0].updatedBy || undefined,
        createdAt: result[0].createdAt,
      };
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
      
      if (!result) return null;
      
      return {
        id: result.id,
        courseId: result.courseId,
        professorId: result.professorId || undefined,
        semester: result.semester,
        year: result.year,
        season: result.season as 'Fall' | 'Spring',
        updatedBy: result.updatedBy || undefined,
        createdAt: result.createdAt,
        course: result.course ? {
          id: result.course.id,
          courseNumber: result.course.courseNumber,
          courseName: result.course.courseName,
          createdAt: result.course.createdAt
        } : undefined,
        professor: result.professor ? {
          id: result.professor.id,
          firstName: result.professor.firstName,
          lastName: result.professor.lastName,
          email: result.professor.email,
          createdAt: result.professor.createdAt
        } : undefined,
        taAssignments: result.taAssignments ? result.taAssignments.map(ta => ({
          id: ta.id,
          userId: ta.userId,
          courseOfferingId: ta.courseOfferingId,
          hoursPerWeek: ta.hoursPerWeek || undefined,
          responsibilities: ta.responsibilities || undefined,
          createdAt: ta.createdAt,
          user: ta.user ? {
            id: (ta.user as User).id,
            email: (ta.user as User).email,
            firstName: (ta.user as User).firstName,
            lastName: (ta.user as User).lastName,
            gradYear: (ta.user as User).gradYear || undefined,
            degreeProgram: (ta.user as User).degreeProgram || undefined,
            currentRole: (ta.user as User).currentRole || undefined,
            linkedinUrl: (ta.user as User).linkedinUrl || undefined,
            personalSite: (ta.user as User).personalSite || undefined,
            location: (ta.user as User).location || undefined,
            role: (ta.user as User).role as 'head_ta' | 'admin',
            invitedBy: (ta.user as User).invitedBy || undefined,
            createdAt: (ta.user as User).createdAt,
            updatedAt: (ta.user as User).updatedAt
          } : undefined
        })) : undefined
      } as CourseOfferingWithRelations;
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
      
      return result.map(row => ({
        id: row.id,
        courseId: row.courseId,
        professorId: row.professorId || undefined,
        semester: row.semester,
        year: row.year,
        season: row.season as 'Fall' | 'Spring',
        updatedBy: row.updatedBy || undefined,
        createdAt: row.createdAt,
        course: row.course ? {
          id: row.course.id,
          courseNumber: row.course.courseNumber,
          courseName: row.course.courseName,
          createdAt: row.course.createdAt
        } : undefined,
        professor: row.professor ? {
          id: row.professor.id,
          firstName: row.professor.firstName,
          lastName: row.professor.lastName,
          email: row.professor.email,
          createdAt: row.professor.createdAt
        } : undefined,
        taAssignments: row.taAssignments ? row.taAssignments.map((ta: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          id: ta.id,
          userId: ta.userId,
          courseOfferingId: ta.courseOfferingId,
          hoursPerWeek: ta.hoursPerWeek || undefined,
          responsibilities: ta.responsibilities || undefined,
          createdAt: ta.createdAt,
          user: ta.user ? {
            id: (ta.user as User).id,
            email: (ta.user as User).email,
            firstName: (ta.user as User).firstName,
            lastName: (ta.user as User).lastName,
            gradYear: (ta.user as User).gradYear || undefined,
            degreeProgram: (ta.user as User).degreeProgram || undefined,
            currentRole: (ta.user as User).currentRole || undefined,
            linkedinUrl: (ta.user as User).linkedinUrl || undefined,
            personalSite: (ta.user as User).personalSite || undefined,
            location: (ta.user as User).location || undefined,
            role: (ta.user as User).role as 'head_ta' | 'admin',
            invitedBy: (ta.user as User).invitedBy || undefined,
            createdAt: (ta.user as User).createdAt,
            updatedAt: (ta.user as User).updatedAt
          } : undefined
        })) : undefined
      } as CourseOfferingWithRelations));
    } catch (error) {
      console.error('Error finding course offerings with relations:', error);
      throw new Error('Failed to find course offerings');
    }
  }

  /**
   * Check if a course offering exists
   */
  async exists(courseId: string, year: number, season: 'Fall' | 'Spring'): Promise<boolean> {
    console.log('[COURSE_OFFERING_REPO] Checking existence for:', { courseId, year, season });
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
      
      const exists = result.length > 0;
      console.log('[COURSE_OFFERING_REPO] Existence check result:', { 
        exists, 
        foundId: exists ? result[0].id : null 
      });
      return exists;
    } catch (error) {
      console.error('[COURSE_OFFERING_REPO] Error checking course offering existence:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        courseId,
        year,
        season
      });
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
      const result = await db.select({ count: count() })
        .from(courseOfferings)
        .where(eq(courseOfferings.courseId, courseId));
      
      return Number(result[0]?.count) || 0;
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
      
      return result.map(row => ({
        id: row.id,
        courseId: row.courseId,
        professorId: row.professorId || undefined,
        semester: row.semester,
        year: row.year,
        season: row.season as 'Fall' | 'Spring',
        updatedBy: row.updatedBy || undefined,
        createdAt: row.createdAt,
      }));
    } catch (error) {
      console.error('Error batch creating course offerings:', error);
      throw new Error('Failed to create course offerings');
    }
  }

  /**
   * Batch create historical course offerings with duplicate checking
   */
  async createHistoricalBatch(inputs: CreateCourseOfferingInput[]): Promise<{ created: number; skipped: number; offerings: CourseOffering[] }> {
    console.log('[COURSE_OFFERING_REPO] createHistoricalBatch started', { inputCount: inputs.length });
    const batchStartTime = Date.now();
    
    try {
      // Step 1: Check which offerings already exist using a single query
      console.log('[COURSE_OFFERING_REPO] Checking for existing offerings');
      const checkStartTime = Date.now();
      
      // Create unique identifiers for each input
      const offeringKeys = inputs.map(input => ({
        courseId: input.courseId,
        year: input.year,
        season: input.season
      }));

      // Build a query to find all existing offerings that match our inputs
      const existingOfferings = await db
        .select({
          courseId: courseOfferings.courseId,
          year: courseOfferings.year,
          season: courseOfferings.season
        })
        .from(courseOfferings)
        .where(
          sql`(${courseOfferings.courseId}, ${courseOfferings.year}, ${courseOfferings.season}) IN (${
            sql.join(
              offeringKeys.map(key => 
                sql`(${key.courseId}, ${key.year}, ${key.season})`
              ),
              sql`, `
            )
          })`
        );

      const checkDuration = Date.now() - checkStartTime;
      console.log('[COURSE_OFFERING_REPO] Existence check completed', { 
        duration: checkDuration, 
        existingCount: existingOfferings.length 
      });

      // Create a Set of existing offerings for O(1) lookup
      const existingSet = new Set(
        existingOfferings.map(o => `${o.courseId}-${o.year}-${o.season}`)
      );

      // Step 2: Filter out offerings that already exist
      const toCreate = inputs.filter(input => {
        const key = `${input.courseId}-${input.year}-${input.season}`;
        return !existingSet.has(key);
      });

      const skipped = inputs.length - toCreate.length;
      console.log('[COURSE_OFFERING_REPO] Filtered offerings', { 
        toCreate: toCreate.length, 
        skipped 
      });

      // Step 3: Bulk insert all non-existing offerings
      let created: CourseOffering[] = [];
      if (toCreate.length > 0) {
        const insertStartTime = Date.now();
        console.log('[COURSE_OFFERING_REPO] Bulk inserting offerings', { count: toCreate.length });
        
        const result = await db.insert(courseOfferings)
          .values(toCreate)
          .returning();
        
        created = result.map(row => ({
          id: row.id,
          courseId: row.courseId,
          professorId: row.professorId || undefined,
          semester: row.semester,
          year: row.year,
          season: row.season as 'Fall' | 'Spring',
          updatedBy: row.updatedBy || undefined,
          createdAt: row.createdAt,
        }));
        
        const insertDuration = Date.now() - insertStartTime;
        console.log('[COURSE_OFFERING_REPO] Bulk insert completed', { 
          duration: insertDuration,
          created: created.length 
        });
      }

      const totalDuration = Date.now() - batchStartTime;
      console.log('[COURSE_OFFERING_REPO] createHistoricalBatch completed', {
        totalDuration,
        created: created.length,
        skipped,
        averageTimePerItem: totalDuration / inputs.length
      });

      return {
        created: created.length,
        skipped,
        offerings: created
      };
    } catch (error) {
      const duration = Date.now() - batchStartTime;
      console.error('[COURSE_OFFERING_REPO] Error batch creating historical course offerings:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        duration
      });
      throw new Error('Failed to create historical course offerings');
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
      
      return result.map(row => ({
        id: row.id,
        courseId: row.courseId,
        professorId: row.professorId || undefined,
        semester: row.semester,
        year: row.year,
        season: row.season as 'Fall' | 'Spring',
        updatedBy: row.updatedBy || undefined,
        createdAt: row.createdAt,
        course: row.course ? {
          id: row.course.id,
          courseNumber: row.course.courseNumber,
          courseName: row.course.courseName,
          createdAt: row.course.createdAt
        } : undefined,
        professor: row.professor ? {
          id: row.professor.id,
          firstName: row.professor.firstName,
          lastName: row.professor.lastName,
          email: row.professor.email,
          createdAt: row.professor.createdAt
        } : undefined,
        taAssignments: row.taAssignments ? row.taAssignments.map((ta: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          id: ta.id,
          userId: ta.userId,
          courseOfferingId: ta.courseOfferingId,
          hoursPerWeek: ta.hoursPerWeek || undefined,
          responsibilities: ta.responsibilities || undefined,
          createdAt: ta.createdAt,
          user: ta.user ? {
            id: (ta.user as User).id,
            email: (ta.user as User).email,
            firstName: (ta.user as User).firstName,
            lastName: (ta.user as User).lastName,
            gradYear: (ta.user as User).gradYear || undefined,
            degreeProgram: (ta.user as User).degreeProgram || undefined,
            currentRole: (ta.user as User).currentRole || undefined,
            linkedinUrl: (ta.user as User).linkedinUrl || undefined,
            personalSite: (ta.user as User).personalSite || undefined,
            location: (ta.user as User).location || undefined,
            role: (ta.user as User).role as 'head_ta' | 'admin',
            invitedBy: (ta.user as User).invitedBy || undefined,
            createdAt: (ta.user as User).createdAt,
            updatedAt: (ta.user as User).updatedAt
          } : undefined
        })) : undefined
      } as CourseOfferingWithRelations));
    } catch (error) {
      console.error('Error finding all course offerings with relations:', error);
      throw new Error('Failed to find course offerings');
    }
  }

  /**
   * Find course offerings with relations by professor ID
   */
  async findWithRelationsByProfessorId(professorId: string): Promise<CourseOfferingWithRelations[]> {
    try {
      const result = await db.query.courseOfferings.findMany({
        where: eq(courseOfferings.professorId, professorId),
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
      
      return result.map(row => ({
        id: row.id,
        courseId: row.courseId,
        professorId: row.professorId || undefined,
        semester: row.semester,
        year: row.year,
        season: row.season as 'Fall' | 'Spring',
        updatedBy: row.updatedBy || undefined,
        createdAt: row.createdAt,
        course: row.course ? {
          id: row.course.id,
          courseNumber: row.course.courseNumber,
          courseName: row.course.courseName,
          createdAt: row.course.createdAt
        } : undefined,
        professor: row.professor ? {
          id: row.professor.id,
          firstName: row.professor.firstName,
          lastName: row.professor.lastName,
          email: row.professor.email,
          createdAt: row.professor.createdAt
        } : undefined,
        taAssignments: row.taAssignments ? row.taAssignments.map((ta: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          id: ta.id,
          userId: ta.userId,
          courseOfferingId: ta.courseOfferingId,
          hoursPerWeek: ta.hoursPerWeek || undefined,
          responsibilities: ta.responsibilities || undefined,
          createdAt: ta.createdAt,
          user: ta.user ? {
            id: (ta.user as User).id,
            email: (ta.user as User).email,
            firstName: (ta.user as User).firstName,
            lastName: (ta.user as User).lastName,
            gradYear: (ta.user as User).gradYear || undefined,
            degreeProgram: (ta.user as User).degreeProgram || undefined,
            currentRole: (ta.user as User).currentRole || undefined,
            linkedinUrl: (ta.user as User).linkedinUrl || undefined,
            personalSite: (ta.user as User).personalSite || undefined,
            location: (ta.user as User).location || undefined,
            role: (ta.user as User).role as 'head_ta' | 'admin',
            invitedBy: (ta.user as User).invitedBy || undefined,
            createdAt: (ta.user as User).createdAt,
            updatedAt: (ta.user as User).updatedAt
          } : undefined
        })) : undefined
      } as CourseOfferingWithRelations));
    } catch (error) {
      console.error('Error finding course offerings with relations by professor:', error);
      throw new Error('Failed to find course offerings');
    }
  }

  /**
   * Find course offerings with relations by multiple professor IDs
   */
  async findWithRelationsByProfessorIds(professorIds: string[]): Promise<CourseOfferingWithRelations[]> {
    try {
      if (professorIds.length === 0) {
        return [];
      }
      
      const result = await db.query.courseOfferings.findMany({
        where: inArray(courseOfferings.professorId, professorIds),
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
      
      return result.map(row => ({
        id: row.id,
        courseId: row.courseId,
        professorId: row.professorId || undefined,
        semester: row.semester,
        year: row.year,
        season: row.season as 'Fall' | 'Spring',
        updatedBy: row.updatedBy || undefined,
        createdAt: row.createdAt,
        course: row.course ? {
          id: row.course.id,
          courseNumber: row.course.courseNumber,
          courseName: row.course.courseName,
          createdAt: row.course.createdAt
        } : undefined,
        professor: row.professor ? {
          id: row.professor.id,
          firstName: row.professor.firstName,
          lastName: row.professor.lastName,
          email: row.professor.email,
          createdAt: row.professor.createdAt
        } : undefined,
        taAssignments: row.taAssignments ? row.taAssignments.map((ta: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          id: ta.id,
          userId: ta.userId,
          courseOfferingId: ta.courseOfferingId,
          hoursPerWeek: ta.hoursPerWeek || undefined,
          responsibilities: ta.responsibilities || undefined,
          createdAt: ta.createdAt,
          user: ta.user ? {
            id: (ta.user as User).id,
            email: (ta.user as User).email,
            firstName: (ta.user as User).firstName,
            lastName: (ta.user as User).lastName,
            gradYear: (ta.user as User).gradYear || undefined,
            degreeProgram: (ta.user as User).degreeProgram || undefined,
            currentRole: (ta.user as User).currentRole || undefined,
            linkedinUrl: (ta.user as User).linkedinUrl || undefined,
            personalSite: (ta.user as User).personalSite || undefined,
            location: (ta.user as User).location || undefined,
            role: (ta.user as User).role as 'head_ta' | 'admin',
            invitedBy: (ta.user as User).invitedBy || undefined,
            createdAt: (ta.user as User).createdAt,
            updatedAt: (ta.user as User).updatedAt
          } : undefined
        })) : undefined
      } as CourseOfferingWithRelations));
    } catch (error) {
      console.error('Error finding course offerings with relations by professor IDs:', error);
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
      
      return result.map(row => ({
        id: row.id,
        courseId: row.courseId,
        professorId: row.professorId || undefined,
        semester: row.semester,
        year: row.year,
        season: row.season as 'Fall' | 'Spring',
        updatedBy: row.updatedBy || undefined,
        createdAt: row.createdAt,
        course: row.course ? {
          id: row.course.id,
          courseNumber: row.course.courseNumber,
          courseName: row.course.courseName,
          createdAt: row.course.createdAt
        } : undefined,
        professor: row.professor ? {
          id: row.professor.id,
          firstName: row.professor.firstName,
          lastName: row.professor.lastName,
          email: row.professor.email,
          createdAt: row.professor.createdAt
        } : undefined,
        taAssignments: row.taAssignments ? row.taAssignments.map((ta: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          id: ta.id,
          userId: ta.userId,
          courseOfferingId: ta.courseOfferingId,
          hoursPerWeek: ta.hoursPerWeek || undefined,
          responsibilities: ta.responsibilities || undefined,
          createdAt: ta.createdAt,
          user: ta.user ? {
            id: (ta.user as User).id,
            email: (ta.user as User).email,
            firstName: (ta.user as User).firstName,
            lastName: (ta.user as User).lastName,
            gradYear: (ta.user as User).gradYear || undefined,
            degreeProgram: (ta.user as User).degreeProgram || undefined,
            currentRole: (ta.user as User).currentRole || undefined,
            linkedinUrl: (ta.user as User).linkedinUrl || undefined,
            personalSite: (ta.user as User).personalSite || undefined,
            location: (ta.user as User).location || undefined,
            role: (ta.user as User).role as 'head_ta' | 'admin',
            invitedBy: (ta.user as User).invitedBy || undefined,
            createdAt: (ta.user as User).createdAt,
            updatedAt: (ta.user as User).updatedAt
          } : undefined
        })) : undefined
      } as CourseOfferingWithRelations));
    } catch (error) {
      console.error('Error finding course offerings with relations by course:', error);
      throw new Error('Failed to find course offerings');
    }
  }
}

// Export a singleton instance
export const courseOfferingRepository = new CourseOfferingRepository();