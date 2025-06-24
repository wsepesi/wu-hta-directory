import { db } from './db';
import { invitations, users, courseOfferings, courses, taAssignments } from './db/schema';
import { eq, and, gte, sql, isNull } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { sendInvitationEmail, sendTargetedInvitationEmail } from './email-service';

interface InvitationResult {
  success: boolean;
  invitation?: {
    id: string;
    token: string;
    email: string;
    expiresAt: Date;
  };
  error?: string;
}

interface InvitationValidation {
  isValid: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  error?: string;
}

interface TargetedInvitation {
  courseOfferingId: string;
  courseNumber: string;
  courseName: string;
  semester: string;
  professorName: string | null;
  recipientEmail: string;
  recipientName?: string;
  message?: string;
}

/**
 * Generate a secure invitation token
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Validate an invitation token
 */
export async function validateInvitationToken(token: string): Promise<InvitationValidation> {
  // Find the invitation
  const invitation = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      expiresAt: invitations.expiresAt,
      usedAt: invitations.usedAt,
    })
    .from(invitations)
    .where(eq(invitations.token, token))
    .limit(1);
  
  if (invitation.length === 0) {
    return {
      isValid: false,
      error: 'Invalid invitation token',
    };
  }
  
  const inv = invitation[0];
  
  // Check if already used
  if (inv.usedAt) {
    return {
      isValid: false,
      error: 'This invitation has already been used',
    };
  }
  
  // Check if expired
  if (inv.expiresAt < new Date()) {
    return {
      isValid: false,
      error: 'This invitation has expired',
    };
  }
  
  // Check if email is already registered
  const existingUser = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.email, inv.email))
    .limit(1);
  
  if (existingUser.length > 0) {
    return {
      isValid: false,
      error: 'A user with this email already exists',
      user: existingUser[0],
    };
  }
  
  return {
    isValid: true,
  };
}

/**
 * Create an invitation
 */
export async function createInvitation(
  invitedBy: string,
  recipientEmail: string,
  role: 'head_ta' | 'admin' = 'head_ta',
  expirationDays: number = 7
): Promise<InvitationResult> {
  try {
    // Validate inviter exists
    const inviter = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, invitedBy))
      .limit(1);
    
    if (inviter.length === 0) {
      return {
        success: false,
        error: 'Inviter not found',
      };
    }
    
    // Check permissions
    if (role === 'admin' && inviter[0].role !== 'admin') {
      return {
        success: false,
        error: 'Only admins can invite other admins',
      };
    }
    
    // Check if email is already registered
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, recipientEmail))
      .limit(1);
    
    if (existingUser.length > 0) {
      return {
        success: false,
        error: 'A user with this email already exists',
      };
    }
    
    // Check for existing pending invitation
    const existingInvitation = await db
      .select({ id: invitations.id })
      .from(invitations)
      .where(
        and(
          eq(invitations.email, recipientEmail),
          gte(invitations.expiresAt, new Date()),
          isNull(invitations.usedAt)
        )
      )
      .limit(1);
    
    if (existingInvitation.length > 0) {
      return {
        success: false,
        error: 'An active invitation already exists for this email',
      };
    }
    
    // Create invitation
    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);
    
    const newInvitation = await db
      .insert(invitations)
      .values({
        email: recipientEmail,
        invitedBy,
        token,
        expiresAt,
      })
      .returning({
        id: invitations.id,
        email: invitations.email,
        token: invitations.token,
        expiresAt: invitations.expiresAt,
      });
    
    // Send invitation email
    const inviterName = `${inviter[0].firstName} ${inviter[0].lastName}`;
    await sendInvitationEmail({
      to: recipientEmail,
      inviterName,
      invitationToken: token,
      role,
      expirationDays,
    });
    
    return {
      success: true,
      invitation: newInvitation[0],
    };
  } catch (error) {
    console.error('Error creating invitation:', error);
    return {
      success: false,
      error: 'Failed to create invitation',
    };
  }
}

/**
 * Send targeted invitation for a specific course needing TAs
 */
export async function sendTargetedInvitation(
  invitedBy: string,
  invitation: TargetedInvitation
): Promise<InvitationResult> {
  try {
    // Validate inviter
    const inviter = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, invitedBy))
      .limit(1);
    
    if (inviter.length === 0) {
      return {
        success: false,
        error: 'Inviter not found',
      };
    }
    
    // Validate course offering exists
    const offering = await db
      .select({ id: courseOfferings.id })
      .from(courseOfferings)
      .where(eq(courseOfferings.id, invitation.courseOfferingId))
      .limit(1);
    
    if (offering.length === 0) {
      return {
        success: false,
        error: 'Course offering not found',
      };
    }
    
    // Create invitation with longer expiration for targeted invites
    const result = await createInvitation(invitedBy, invitation.recipientEmail, 'head_ta', 14);
    
    if (!result.success || !result.invitation) {
      return result;
    }
    
    // Send targeted invitation email
    const inviterName = `${inviter[0].firstName} ${inviter[0].lastName}`;
    await sendTargetedInvitationEmail({
      to: invitation.recipientEmail,
      recipientName: invitation.recipientName,
      inviterName,
      invitationToken: result.invitation.token,
      courseNumber: invitation.courseNumber,
      courseName: invitation.courseName,
      semester: invitation.semester,
      professorName: invitation.professorName,
      message: invitation.message,
      expirationDays: 14,
    });
    
    return result;
  } catch (error) {
    console.error('Error sending targeted invitation:', error);
    return {
      success: false,
      error: 'Failed to send targeted invitation',
    };
  }
}

/**
 * Mark an invitation as used
 */
export async function markInvitationUsed(token: string): Promise<boolean> {
  try {
    const result = await db
      .update(invitations)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(invitations.token, token),
          isNull(invitations.usedAt)
        )
      );
    
    return true;
  } catch (error) {
    console.error('Error marking invitation as used:', error);
    return false;
  }
}

/**
 * Get invitation statistics for a user
 */
export async function getUserInvitationStats(userId: string): Promise<{
  totalSent: number;
  totalAccepted: number;
  pendingInvitations: Array<{
    id: string;
    email: string;
    createdAt: Date;
    expiresAt: Date;
  }>;
  acceptedInvitations: Array<{
    email: string;
    userName: string;
    joinedAt: Date;
  }>;
}> {
  // Get all invitations sent by user
  const allInvitations = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      createdAt: invitations.createdAt,
      expiresAt: invitations.expiresAt,
      usedAt: invitations.usedAt,
    })
    .from(invitations)
    .where(eq(invitations.invitedBy, userId))
    .orderBy(invitations.createdAt);
  
  // Get users who joined via invitation
  const joinedUsers = await db
    .select({
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.invitedBy, userId))
    .orderBy(users.createdAt);
  
  const now = new Date();
  const pendingInvitations = allInvitations
    .filter(inv => !inv.usedAt && inv.expiresAt > now)
    .map(inv => ({
      id: inv.id,
      email: inv.email,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
    }));
  
  const acceptedInvitations = joinedUsers.map(user => ({
    email: user.email,
    userName: `${user.firstName} ${user.lastName}`,
    joinedAt: user.createdAt,
  }));
  
  return {
    totalSent: allInvitations.length,
    totalAccepted: joinedUsers.length,
    pendingInvitations,
    acceptedInvitations,
  };
}

/**
 * Clean up expired invitations
 */
export async function cleanupExpiredInvitations(): Promise<number> {
  try {
    const result = await db
      .delete(invitations)
      .where(
        and(
          sql`${invitations.expiresAt} < NOW()`,
          isNull(invitations.usedAt)
        )
      );
    
    return 0; // Drizzle doesn't return row count easily
  } catch (error) {
    console.error('Error cleaning up invitations:', error);
    return 0;
  }
}