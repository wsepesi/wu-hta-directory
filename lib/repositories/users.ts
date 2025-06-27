import { eq, and, or, desc, asc, like, count, isNotNull, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import type {
  User,
  UserWithRelations,
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
  TAAssignmentWithRelations,
} from '@/lib/types';
import { hash } from 'bcryptjs';

export class UserRepository {
  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const result = await db.select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      
      if (!result[0]) return null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...user } = result[0];
      return user as User;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await db.select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      
      if (!result[0]) return null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...user } = result[0];
      return user as User;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Find users by graduation year
   */
  async findByGradYear(gradYear: number): Promise<User[]> {
    try {
      const result = await db.select()
        .from(users)
        .where(eq(users.gradYear, gradYear))
        .orderBy(asc(users.lastName), asc(users.firstName));
      
      return result.map(row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...user } = row;
        return user as User;
      });
    } catch (error) {
      console.error('Error finding users by grad year:', error);
      throw new Error('Failed to find users');
    }
  }

  /**
   * Find users by location
   */
  async findByLocation(location: string): Promise<User[]> {
    try {
      const result = await db.select()
        .from(users)
        .where(eq(users.location, location))
        .orderBy(asc(users.lastName), asc(users.firstName));
      
      return result.map(row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...user } = row;
        return user as User;
      });
    } catch (error) {
      console.error('Error finding users by location:', error);
      throw new Error('Failed to find users');
    }
  }

  /**
   * Find all users with optional filters
   */
  async findAll(filters?: UserFilters): Promise<User[]> {
    try {
      let queryBuilder = db.select().from(users);
      
      const conditions = [];
      
      // By default, exclude unclaimed profiles unless explicitly requested
      conditions.push(or(eq(users.isUnclaimed, false), isNull(users.isUnclaimed)));
      
      if (filters) {
        if (filters.gradYear) {
          conditions.push(eq(users.gradYear, filters.gradYear));
        }
        
        if (filters.location) {
          conditions.push(eq(users.location, filters.location));
        }
        
        if (filters.degreeProgram) {
          conditions.push(eq(users.degreeProgram, filters.degreeProgram));
        }
      }
      
      if (conditions.length > 0) {
        queryBuilder = queryBuilder.where(and(...conditions)) as typeof queryBuilder;
      }
      
      const result = await queryBuilder.orderBy(desc(users.createdAt));
      return result.map(row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...user } = row;
        return user as User;
      });
    } catch (error) {
      console.error('Error finding all users:', error);
      throw new Error('Failed to find users');
    }
  }

  /**
   * Create a new user
   */
  async create(input: CreateUserInput): Promise<User> {
    try {
      // Hash the password before storing
      const passwordHash = await hash(input.password, 10);
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userData } = input;
      
      const result = await db.insert(users)
        .values({
          ...userData,
          email: userData.email.toLowerCase(),
          passwordHash,
          role: userData.role || 'head_ta',
        })
        .returning();
      
      if (!result || (Array.isArray(result) && result.length === 0) || !result[0]) {
        throw new Error('Failed to create user');
      }
      
      // Remove passwordHash from the returned user
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...user } = result[0];
      return user as User;
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof Error && error.message.includes('unique')) {
        throw new Error('User with this email already exists');
      }
      throw new Error('Failed to create user');
    }
  }

  /**
   * Update a user
   */
  async update(id: string, input: UpdateUserInput): Promise<User> {
    try {
      const result = await db.update(users)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();
      
      if (!result[0]) {
        throw new Error('User not found');
      }
      
      // Remove passwordHash from the returned user
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...user } = result[0];
      return user as User;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * Delete a user
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete(users)
        .where(eq(users.id, id))
        .returning();
      
      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Find users with their relations
   */
  async findWithRelations(id: string): Promise<UserWithRelations | null> {
    try {
      const result = await db.query.users.findFirst({
        where: eq(users.id, id),
        with: {
          inviter: true,
          taAssignments: {
            with: {
              courseOffering: {
                with: {
                  course: true,
                  professor: true,
                },
              },
            },
          },
        },
      });
      
      if (!result) return null;
      
      return {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        gradYear: result.gradYear || undefined,
        degreeProgram: result.degreeProgram || undefined,
        currentRole: result.currentRole || undefined,
        linkedinUrl: result.linkedinUrl || undefined,
        personalSite: result.personalSite || undefined,
        location: result.location || undefined,
        role: result.role as 'head_ta' | 'admin',
        invitedBy: result.invitedBy || undefined,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        inviter: result.inviter ? {
          id: (result.inviter as User).id,
          email: (result.inviter as User).email,
          firstName: (result.inviter as User).firstName,
          lastName: (result.inviter as User).lastName,
          gradYear: (result.inviter as User).gradYear || undefined,
          degreeProgram: (result.inviter as User).degreeProgram || undefined,
          currentRole: (result.inviter as User).currentRole || undefined,
          linkedinUrl: (result.inviter as User).linkedinUrl || undefined,
          personalSite: (result.inviter as User).personalSite || undefined,
          location: (result.inviter as User).location || undefined,
          role: (result.inviter as User).role as 'head_ta' | 'admin',
          invitedBy: (result.inviter as User).invitedBy || undefined,
          createdAt: (result.inviter as User).createdAt,
          updatedAt: (result.inviter as User).updatedAt
        } : undefined,
        taAssignments: result.taAssignments ? (result.taAssignments as TAAssignmentWithRelations[]).map(assignment => ({
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
        })) : undefined
      } as UserWithRelations;
    } catch (error) {
      console.error('Error finding user with relations:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Search users by name or email
   */
  async search(query: string): Promise<User[]> {
    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      
      const result = await db.select()
        .from(users)
        .where(
          and(
            or(
              like(users.email, searchTerm),
              like(users.firstName, searchTerm),
              like(users.lastName, searchTerm)
            ),
            // Exclude unclaimed profiles from regular search
            or(eq(users.isUnclaimed, false), isNull(users.isUnclaimed))
          )
        )
        .orderBy(asc(users.lastName), asc(users.firstName))
        .limit(50);
      
      return result.map(row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...user } = row;
        return user as User;
      });
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  /**
   * Count users by filters
   */
  async count(filters?: UserFilters): Promise<number> {
    try {
      let queryBuilder = db.select({ count: count() }).from(users);
      
      const conditions = [];
      
      // By default, exclude unclaimed profiles unless explicitly requested
      conditions.push(or(eq(users.isUnclaimed, false), isNull(users.isUnclaimed)));
      
      if (filters) {
        if (filters.gradYear) {
          conditions.push(eq(users.gradYear, filters.gradYear));
        }
        
        if (filters.location) {
          conditions.push(eq(users.location, filters.location));
        }
        
        if (filters.degreeProgram) {
          conditions.push(eq(users.degreeProgram, filters.degreeProgram));
        }
      }
      
      if (conditions.length > 0) {
        queryBuilder = queryBuilder.where(and(...conditions)) as typeof queryBuilder;
      }
      
      const result = await queryBuilder;
      return Number(result[0]?.count) || 0;
    } catch (error) {
      console.error('Error counting users:', error);
      throw new Error('Failed to count users');
    }
  }

  /**
   * Get distinct locations
   */
  async getDistinctLocations(): Promise<string[]> {
    try {
      const result = await db.selectDistinct({ location: users.location })
        .from(users)
        .where(isNotNull(users.location))
        .orderBy(asc(users.location));
      
      return result.map(row => row.location).filter(Boolean) as string[];
    } catch (error) {
      console.error('Error getting distinct locations:', error);
      throw new Error('Failed to get locations');
    }
  }

  /**
   * Get distinct graduation years
   */
  async getDistinctGradYears(): Promise<number[]> {
    try {
      const result = await db.selectDistinct({ gradYear: users.gradYear })
        .from(users)
        .where(isNotNull(users.gradYear))
        .orderBy(desc(users.gradYear));
      
      return result.map(row => row.gradYear).filter(Boolean) as number[];
    } catch (error) {
      console.error('Error getting distinct grad years:', error);
      throw new Error('Failed to get graduation years');
    }
  }

  /**
   * Find a user by ID with password hash included
   */
  async findByIdWithPassword(id: string): Promise<(User & { passwordHash: string }) | null> {
    try {
      const result = await db.select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      
      return (result && result.length > 0 ? result[0] : null) as (User & { passwordHash: string }) | null;
    } catch (error) {
      console.error('Error finding user with password:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Find a user by email with password hash included (for authentication)
   */
  async findByEmailWithPassword(email: string): Promise<(User & { passwordHash: string }) | null> {
    try {
      const result = await db.select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      
      return (result && result.length > 0 ? result[0] : null) as (User & { passwordHash: string }) | null;
    } catch (error) {
      console.error('Error finding user by email with password:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Update a user's password
   */
  async updatePassword(id: string, passwordHash: string): Promise<void> {
    try {
      await db.update(users)
        .set({
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));
    } catch (error) {
      console.error('Error updating password:', error);
      throw new Error('Failed to update password');
    }
  }

  /**
   * Create an unclaimed profile
   */
  async createUnclaimedProfile(data: {
    firstName: string;
    lastName: string;
    email?: string;
    gradYear?: number;
    degreeProgram?: string;
    location?: string;
    recordedBy?: string;
  }): Promise<User> {
    try {
      // Generate a placeholder email if not provided
      const placeholderEmail = data.email || `unclaimed.${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}.${Date.now()}@placeholder.edu`;
      
      const result = await db.insert(users)
        .values({
          firstName: data.firstName,
          lastName: data.lastName,
          email: placeholderEmail,
          passwordHash: 'UNCLAIMED_PROFILE', // Special marker for unclaimed profiles
          gradYear: data.gradYear,
          degreeProgram: data.degreeProgram,
          location: data.location,
          role: 'head_ta',
          isUnclaimed: true,
          recordedBy: data.recordedBy,
          recordedAt: new Date(),
        })
        .returning();
      
      if (!result || result.length === 0) {
        throw new Error('Failed to create unclaimed profile');
      }
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...user } = result[0];
      return user as User;
    } catch (error) {
      console.error('Error creating unclaimed profile:', error);
      throw new Error('Failed to create unclaimed profile');
    }
  }

  /**
   * Find unclaimed profiles with optional search query
   */
  async findUnclaimedProfiles(query?: string): Promise<User[]> {
    try {
      const conditions = [eq(users.isUnclaimed, true)];
      
      if (query) {
        const searchTerm = `%${query.toLowerCase()}%`;
        conditions.push(
          or(
            like(users.firstName, searchTerm),
            like(users.lastName, searchTerm),
            like(users.email, searchTerm)
          )!
        );
      }
      
      const result = await db.select()
        .from(users)
        .where(and(...conditions))
        .orderBy(asc(users.lastName), asc(users.firstName));
      
      return result.map(row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...user } = row;
        return user as User;
      });
    } catch (error) {
      console.error('Error finding unclaimed profiles:', error);
      throw new Error('Failed to find unclaimed profiles');
    }
  }

  /**
   * Find unclaimed profiles that might match a user
   */
  async findClaimableProfiles(userId: string): Promise<User[]> {
    try {
      // First get the user's information
      const claimingUser = await this.findById(userId);
      if (!claimingUser) {
        throw new Error('User not found');
      }
      
      // Find unclaimed profiles with similar names
      const result = await db.select()
        .from(users)
        .where(
          and(
            eq(users.isUnclaimed, true),
            or(
              // Exact name match
              and(
                eq(users.firstName, claimingUser.firstName),
                eq(users.lastName, claimingUser.lastName)
              ),
              // Partial name match (same last name)
              eq(users.lastName, claimingUser.lastName),
              // Similar first name (for typos)
              like(users.firstName, `%${claimingUser.firstName.substring(0, 3)}%`)
            )
          )
        )
        .orderBy(asc(users.lastName), asc(users.firstName));
      
      return result.map(row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...user } = row;
        return user as User;
      });
    } catch (error) {
      console.error('Error finding claimable profiles:', error);
      throw new Error('Failed to find claimable profiles');
    }
  }

  /**
   * Claim an unclaimed profile
   */
  async claimProfile(unclaimedId: string, claimingUserId: string): Promise<void> {
    try {
      // Verify the unclaimed profile exists and is actually unclaimed
      const unclaimedProfile = await db.select()
        .from(users)
        .where(
          and(
            eq(users.id, unclaimedId),
            eq(users.isUnclaimed, true)
          )
        )
        .limit(1);
      
      if (!unclaimedProfile || unclaimedProfile.length === 0) {
        throw new Error('Unclaimed profile not found or already claimed');
      }
      
      // Verify the claiming user exists
      const claimingUser = await this.findById(claimingUserId);
      if (!claimingUser) {
        throw new Error('Claiming user not found');
      }
      
      // Start a transaction to:
      // 1. Transfer all TA assignments from unclaimed to claiming user
      // 2. Mark the unclaimed profile as claimed
      
      // Import taAssignments table
      const { taAssignments } = await import('@/lib/db/schema');
      
      // Transfer TA assignments
      await db.update(taAssignments)
        .set({
          userId: claimingUserId,
        })
        .where(eq(taAssignments.userId, unclaimedId));
      
      // Mark profile as claimed
      await db.update(users)
        .set({
          claimedBy: claimingUserId,
          claimedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, unclaimedId));
      
    } catch (error) {
      console.error('Error claiming profile:', error);
      throw error;
    }
  }

  /**
   * Check if an unclaimed profile exists by name
   */
  async getUnclaimedByName(firstName: string, lastName: string): Promise<User | null> {
    try {
      const result = await db.select()
        .from(users)
        .where(
          and(
            eq(users.firstName, firstName),
            eq(users.lastName, lastName),
            eq(users.isUnclaimed, true)
          )
        )
        .limit(1);
      
      if (!result || result.length === 0) {
        return null;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...user } = result[0];
      return user as User;
    } catch (error) {
      console.error('Error finding unclaimed profile by name:', error);
      throw new Error('Failed to find unclaimed profile');
    }
  }

  /**
   * Mark an unclaimed profile as invitation sent
   */
  async markInvitationSent(userId: string): Promise<void> {
    try {
      await db.update(users)
        .set({
          invitationSent: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(users.id, userId),
            eq(users.isUnclaimed, true)
          )
        );
    } catch (error) {
      console.error('Error marking invitation sent:', error);
      throw new Error('Failed to mark invitation sent');
    }
  }

  /**
   * Get all unclaimed profiles without invitations
   */
  async getUnclaimedWithoutInvitations(): Promise<User[]> {
    try {
      const result = await db.select()
        .from(users)
        .where(
          and(
            eq(users.isUnclaimed, true),
            isNull(users.invitationSent)
          )
        )
        .orderBy(desc(users.recordedAt), asc(users.lastName), asc(users.firstName));
      
      return result.map(row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...user } = row;
        return user as User;
      });
    } catch (error) {
      console.error('Error getting unclaimed profiles without invitations:', error);
      throw new Error('Failed to get unclaimed profiles');
    }
  }

  /**
   * Get unclaimed profiles recorded by a specific user
   */
  async getUnclaimedByRecorder(recorderId: string): Promise<User[]> {
    try {
      const result = await db.select()
        .from(users)
        .where(
          and(
            eq(users.isUnclaimed, true),
            eq(users.recordedBy, recorderId)
          )
        )
        .orderBy(desc(users.recordedAt), asc(users.lastName), asc(users.firstName));
      
      return result.map(row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...user } = row;
        return user as User;
      });
    } catch (error) {
      console.error('Error getting unclaimed profiles by recorder:', error);
      throw new Error('Failed to get unclaimed profiles');
    }
  }

  /**
   * Get unclaimed profiles with invitation status
   */
  async getUnclaimedWithInvitationStatus(): Promise<(User & { hasInvitation: boolean })[]> {
    try {
      const result = await db.select()
        .from(users)
        .where(eq(users.isUnclaimed, true))
        .orderBy(
          asc(users.invitationSent), // nulls first
          desc(users.recordedAt),
          asc(users.lastName),
          asc(users.firstName)
        );
      
      return result.map(row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...user } = row;
        return {
          ...user,
          hasInvitation: user.invitationSent !== null
        } as User & { hasInvitation: boolean };
      });
    } catch (error) {
      console.error('Error getting unclaimed profiles with invitation status:', error);
      throw new Error('Failed to get unclaimed profiles');
    }
  }
}

// Export a singleton instance
export const userRepository = new UserRepository();