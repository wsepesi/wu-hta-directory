import { eq, and, desc, lt, gt, isNull, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { invitations } from '@/lib/db/schema';
import type {
  Invitation,
  InvitationWithRelations,
  CreateInvitationInput,
} from '@/lib/types';
import { randomBytes } from 'crypto';

export class InvitationRepository {
  /**
   * Generate a unique invitation token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Calculate expiration date (7 days from now)
   */
  private getExpirationDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  }

  /**
   * Find an invitation by ID
   */
  async findById(id: string): Promise<Invitation | null> {
    try {
      const result = await db.select()
        .from(invitations)
        .where(eq(invitations.id, id))
        .limit(1);
      
      return result[0] ? {
        ...result[0],
        invitedBy: result[0].invitedBy || undefined,
        usedAt: result[0].usedAt || undefined,
      } : null;
    } catch (error) {
      console.error('Error finding invitation by ID:', error);
      throw new Error('Failed to find invitation');
    }
  }

  /**
   * Find an invitation by token
   */
  async findByToken(token: string): Promise<Invitation | null> {
    try {
      const result = await db.select()
        .from(invitations)
        .where(eq(invitations.token, token))
        .limit(1);
      
      return result[0] ? {
        ...result[0],
        invitedBy: result[0].invitedBy || undefined,
        usedAt: result[0].usedAt || undefined,
      } : null;
    } catch (error) {
      console.error('Error finding invitation by token:', error);
      throw new Error('Failed to find invitation');
    }
  }

  /**
   * Find invitations by email
   */
  async findByEmail(email: string): Promise<Invitation[]> {
    try {
      const result = await db.select()
        .from(invitations)
        .where(eq(invitations.email, email.toLowerCase()))
        .orderBy(desc(invitations.createdAt));
      
      return result.map(row => ({
        ...row,
        invitedBy: row.invitedBy || undefined,
        usedAt: row.usedAt || undefined,
      }));
    } catch (error) {
      console.error('Error finding invitations by email:', error);
      throw new Error('Failed to find invitations');
    }
  }

  /**
   * Find all invitations with optional filters
   */
  async findAll(includeExpired: boolean = false): Promise<Invitation[]> {
    try {
      let queryBuilder = db.select().from(invitations);
      
      if (!includeExpired) {
        queryBuilder = queryBuilder.where(
          and(
            gt(invitations.expiresAt, new Date()),
            isNull(invitations.usedAt)
          )
        ) as typeof queryBuilder;
      }
      
      const result = await queryBuilder.orderBy(desc(invitations.createdAt));
      return result.map(row => ({
        ...row,
        invitedBy: row.invitedBy || undefined,
        usedAt: row.usedAt || undefined,
      }));
    } catch (error) {
      console.error('Error finding all invitations:', error);
      throw new Error('Failed to find invitations');
    }
  }

  /**
   * Find pending invitations (not used and not expired)
   */
  async findPending(): Promise<Invitation[]> {
    try {
      const result = await db.select()
        .from(invitations)
        .where(
          and(
            gt(invitations.expiresAt, new Date()),
            isNull(invitations.usedAt)
          )
        )
        .orderBy(desc(invitations.createdAt));
      
      return result.map(row => ({
        ...row,
        invitedBy: row.invitedBy || undefined,
        usedAt: row.usedAt || undefined,
      }));
    } catch (error) {
      console.error('Error finding pending invitations:', error);
      throw new Error('Failed to find invitations');
    }
  }

  /**
   * Find expired invitations
   */
  async findExpired(): Promise<Invitation[]> {
    try {
      const result = await db.select()
        .from(invitations)
        .where(
          and(
            lt(invitations.expiresAt, new Date()),
            isNull(invitations.usedAt)
          )
        )
        .orderBy(desc(invitations.createdAt));
      
      return result.map(row => ({
        ...row,
        invitedBy: row.invitedBy || undefined,
        usedAt: row.usedAt || undefined,
      }));
    } catch (error) {
      console.error('Error finding expired invitations:', error);
      throw new Error('Failed to find invitations');
    }
  }

  /**
   * Find invitations sent by a specific user
   */
  async findByInviter(inviterId: string): Promise<Invitation[]> {
    try {
      const result = await db.select()
        .from(invitations)
        .where(eq(invitations.invitedBy, inviterId))
        .orderBy(desc(invitations.createdAt));
      
      return result.map(row => ({
        ...row,
        invitedBy: row.invitedBy || undefined,
        usedAt: row.usedAt || undefined,
      }));
    } catch (error) {
      console.error('Error finding invitations by inviter:', error);
      throw new Error('Failed to find invitations');
    }
  }

  /**
   * Create a new invitation
   */
  async create(input: CreateInvitationInput): Promise<Invitation> {
    try {
      // Check if there's already a pending invitation for this email
      const existingPending = await this.findPendingByEmail(input.email);
      if (existingPending) {
        throw new Error('Pending invitation already exists for this email');
      }

      const result = await db.insert(invitations)
        .values({
          email: input.email.toLowerCase(),
          invitedBy: input.invitedBy,
          token: this.generateToken(),
          expiresAt: this.getExpirationDate(),
        })
        .returning();
      
      if (!result[0]) {
        throw new Error('Failed to create invitation');
      }
      
      return {
        ...result[0],
        invitedBy: result[0].invitedBy || undefined,
        usedAt: result[0].usedAt || undefined,
      };
    } catch (error) {
      console.error('Error creating invitation:', error);
      if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
      }
      throw new Error('Failed to create invitation');
    }
  }

  /**
   * Mark an invitation as used
   */
  async markAsUsed(id: string): Promise<Invitation> {
    try {
      const result = await db.update(invitations)
        .set({
          usedAt: new Date(),
        })
        .where(eq(invitations.id, id))
        .returning();
      
      if (!result[0]) {
        throw new Error('Invitation not found');
      }
      
      return {
        ...result[0],
        invitedBy: result[0].invitedBy || undefined,
        usedAt: result[0].usedAt || undefined,
      };
    } catch (error) {
      console.error('Error marking invitation as used:', error);
      throw new Error('Failed to update invitation');
    }
  }

  /**
   * Delete an invitation
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete(invitations)
        .where(eq(invitations.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting invitation:', error);
      throw new Error('Failed to delete invitation');
    }
  }

  /**
   * Find invitation with relations
   */
  async findWithRelations(id: string): Promise<InvitationWithRelations | null> {
    try {
      const result = await db.query.invitations.findFirst({
        where: eq(invitations.id, id),
        with: {
          inviter: true,
        },
      });
      
      if (!result) return null;
      
      return {
        ...result,
        invitedBy: result.invitedBy || undefined,
        usedAt: result.usedAt || undefined,
        inviter: result.inviter || undefined
      } as InvitationWithRelations;
    } catch (error) {
      console.error('Error finding invitation with relations:', error);
      throw new Error('Failed to find invitation');
    }
  }

  /**
   * Find valid invitation by token (not expired and not used)
   */
  async findValidByToken(token: string): Promise<Invitation | null> {
    try {
      const result = await db.select()
        .from(invitations)
        .where(
          and(
            eq(invitations.token, token),
            gt(invitations.expiresAt, new Date()),
            isNull(invitations.usedAt)
          )
        )
        .limit(1);
      
      return result[0] ? {
        ...result[0],
        invitedBy: result[0].invitedBy || undefined,
        usedAt: result[0].usedAt || undefined,
      } : null;
    } catch (error) {
      console.error('Error finding valid invitation by token:', error);
      throw new Error('Failed to find invitation');
    }
  }

  /**
   * Find pending invitation by email
   */
  async findPendingByEmail(email: string): Promise<Invitation | null> {
    try {
      const result = await db.select()
        .from(invitations)
        .where(
          and(
            eq(invitations.email, email.toLowerCase()),
            gt(invitations.expiresAt, new Date()),
            isNull(invitations.usedAt)
          )
        )
        .orderBy(desc(invitations.createdAt))
        .limit(1);
      
      return result[0] ? {
        ...result[0],
        invitedBy: result[0].invitedBy || undefined,
        usedAt: result[0].usedAt || undefined,
      } : null;
    } catch (error) {
      console.error('Error finding pending invitation by email:', error);
      throw new Error('Failed to find invitation');
    }
  }

  /**
   * Extend invitation expiration
   */
  async extendExpiration(id: string, days: number = 7): Promise<Invitation> {
    try {
      const newExpirationDate = new Date();
      newExpirationDate.setDate(newExpirationDate.getDate() + days);
      
      const result = await db.update(invitations)
        .set({
          expiresAt: newExpirationDate,
        })
        .where(eq(invitations.id, id))
        .returning();
      
      if (!result[0]) {
        throw new Error('Invitation not found');
      }
      
      return {
        ...result[0],
        invitedBy: result[0].invitedBy || undefined,
        usedAt: result[0].usedAt || undefined,
      };
    } catch (error) {
      console.error('Error extending invitation expiration:', error);
      throw new Error('Failed to update invitation');
    }
  }

  /**
   * Count pending invitations
   */
  async countPending(): Promise<number> {
    try {
      const result = await db.select({ count: count() })
        .from(invitations)
        .where(
          and(
            gt(invitations.expiresAt, new Date()),
            isNull(invitations.usedAt)
          )
        );
      
      return Number(result[0]?.count) || 0;
    } catch (error) {
      console.error('Error counting pending invitations:', error);
      throw new Error('Failed to count invitations');
    }
  }

  /**
   * Count invitations sent by a user
   */
  async countByInviter(inviterId: string): Promise<number> {
    try {
      const result = await db.select({ count: count() })
        .from(invitations)
        .where(eq(invitations.invitedBy, inviterId));
      
      return Number(result[0]?.count) || 0;
    } catch (error) {
      console.error('Error counting invitations by inviter:', error);
      throw new Error('Failed to count invitations');
    }
  }

  /**
   * Delete expired invitations
   */
  async deleteExpired(): Promise<number> {
    try {
      const result = await db.delete(invitations)
        .where(
          and(
            lt(invitations.expiresAt, new Date()),
            isNull(invitations.usedAt)
          )
        )
        .returning();
      
      return result.length;
    } catch (error) {
      console.error('Error deleting expired invitations:', error);
      throw new Error('Failed to delete invitations');
    }
  }

  /**
   * Regenerate token for an invitation
   */
  async regenerateToken(id: string): Promise<Invitation> {
    try {
      const result = await db.update(invitations)
        .set({
          token: this.generateToken(),
          expiresAt: this.getExpirationDate(),
        })
        .where(eq(invitations.id, id))
        .returning();
      
      if (!result[0]) {
        throw new Error('Invitation not found');
      }
      
      return {
        ...result[0],
        invitedBy: result[0].invitedBy || undefined,
        usedAt: result[0].usedAt || undefined,
      };
    } catch (error) {
      console.error('Error regenerating invitation token:', error);
      throw new Error('Failed to update invitation');
    }
  }

  /**
   * Find all invitations with inviter details
   */
  async findAllWithInviter(): Promise<InvitationWithRelations[]> {
    try {
      const result = await db.query.invitations.findMany({
        with: {
          inviter: true,
        },
        orderBy: [desc(invitations.createdAt)],
      });
      
      return result.map(row => ({
        ...row,
        invitedBy: row.invitedBy || undefined,
        usedAt: row.usedAt || undefined,
        inviter: row.inviter || undefined
      } as InvitationWithRelations));
    } catch (error) {
      console.error('Error finding invitations with inviter:', error);
      throw new Error('Failed to find invitations');
    }
  }

  /**
   * Batch create invitations
   */
  async createBatch(inputs: CreateInvitationInput[]): Promise<Invitation[]> {
    try {
      const invitationValues = inputs.map(input => ({
        email: input.email.toLowerCase(),
        invitedBy: input.invitedBy,
        token: this.generateToken(),
        expiresAt: this.getExpirationDate(),
      }));
      
      const result = await db.insert(invitations)
        .values(invitationValues)
        .returning();
      
      return result.map(row => ({
        ...row,
        invitedBy: row.invitedBy || undefined,
        usedAt: row.usedAt || undefined,
      }));
    } catch (error) {
      console.error('Error batch creating invitations:', error);
      throw new Error('Failed to create invitations');
    }
  }
}

// Export a singleton instance
export const invitationRepository = new InvitationRepository();