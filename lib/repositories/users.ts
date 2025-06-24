import { eq, and, or, desc, asc, like } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import type {
  User,
  UserWithRelations,
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
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
      
      return result[0] || null;
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
      
      return result[0] || null;
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
      
      return result;
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
      
      return result;
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
      let query = db.select().from(users);
      
      if (filters) {
        const conditions = [];
        
        if (filters.gradYear) {
          conditions.push(eq(users.gradYear, filters.gradYear));
        }
        
        if (filters.location) {
          conditions.push(eq(users.location, filters.location));
        }
        
        if (filters.degreeProgram) {
          conditions.push(eq(users.degreeProgram, filters.degreeProgram));
        }
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
      }
      
      const result = await query.orderBy(desc(users.createdAt));
      return result;
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
      
      const { password, ...userData } = input;
      
      const result = await db.insert(users)
        .values({
          ...userData,
          email: userData.email.toLowerCase(),
          passwordHash,
          role: userData.role || 'head_ta',
        })
        .returning();
      
      if (!result[0]) {
        throw new Error('Failed to create user');
      }
      
      // Remove passwordHash from the returned user
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
      
      return result.length > 0;
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
      
      return result || null;
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
          or(
            like(users.email, searchTerm),
            like(users.firstName, searchTerm),
            like(users.lastName, searchTerm)
          )
        )
        .orderBy(asc(users.lastName), asc(users.firstName))
        .limit(50);
      
      return result;
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
      let query = db.select({ count: users.id }).from(users);
      
      if (filters) {
        const conditions = [];
        
        if (filters.gradYear) {
          conditions.push(eq(users.gradYear, filters.gradYear));
        }
        
        if (filters.location) {
          conditions.push(eq(users.location, filters.location));
        }
        
        if (filters.degreeProgram) {
          conditions.push(eq(users.degreeProgram, filters.degreeProgram));
        }
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
      }
      
      const result = await query;
      return result.length;
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
        .where(users.location !== null)
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
        .where(users.gradYear !== null)
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
      
      return result[0] || null;
    } catch (error) {
      console.error('Error finding user with password:', error);
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
}

// Export a singleton instance
export const userRepository = new UserRepository();