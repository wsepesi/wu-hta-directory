import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

export type UserRole = 'admin' | 'head_ta';

interface PermissionContext {
  userId: string;
  userRole?: UserRole;
}

/**
 * Check if a user has admin access
 */
export async function hasAdminAccess(userId: string): Promise<boolean> {
  const user = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  return user.length > 0 && user[0].role === 'admin';
}

/**
 * Check if a user can manage courses (create, edit, delete)
 */
export async function canManageCourses(context: PermissionContext): Promise<boolean> {
  // If role is provided, use it (for performance)
  if (context.userRole) {
    return context.userRole === 'admin';
  }
  
  // Otherwise, fetch from database
  return hasAdminAccess(context.userId);
}

/**
 * Check if a user can send invitations
 */
export async function canSendInvitations(context: PermissionContext): Promise<{
  canSend: boolean;
  allowedRoles: UserRole[];
}> {
  const userRole = context.userRole || await getUserRole(context.userId);
  
  if (!userRole) {
    return {
      canSend: false,
      allowedRoles: [],
    };
  }
  
  switch (userRole) {
    case 'admin':
      // Admins can invite both admins and head TAs
      return {
        canSend: true,
        allowedRoles: ['admin', 'head_ta'],
      };
    case 'head_ta':
      // Head TAs can only invite other head TAs
      return {
        canSend: true,
        allowedRoles: ['head_ta'],
      };
    default:
      return {
        canSend: false,
        allowedRoles: [],
      };
  }
}

/**
 * Check if a user can view private information
 */
export async function canViewPrivateInfo(
  viewerId: string,
  targetUserId: string
): Promise<boolean> {
  // Users can always view their own information
  if (viewerId === targetUserId) {
    return true;
  }
  
  // Admins can view anyone's information
  return hasAdminAccess(viewerId);
}

/**
 * Check if a user can edit another user's profile
 */
export async function canEditUser(
  editorId: string,
  targetUserId: string
): Promise<boolean> {
  // Users can edit their own profile
  if (editorId === targetUserId) {
    return true;
  }
  
  // Only admins can edit other users
  return hasAdminAccess(editorId);
}

/**
 * Check if a user can delete another user
 */
export async function canDeleteUser(
  deleterId: string,
  targetUserId: string
): Promise<boolean> {
  // Users cannot delete themselves
  if (deleterId === targetUserId) {
    return false;
  }
  
  // Only admins can delete users
  return hasAdminAccess(deleterId);
}

/**
 * Check if a user can manage professors
 */
export async function canManageProfessors(context: PermissionContext): Promise<boolean> {
  return canManageCourses(context);
}

/**
 * Check if a user can manage course offerings
 */
export async function canManageCourseOfferings(context: PermissionContext): Promise<boolean> {
  return canManageCourses(context);
}

/**
 * Check if a user can manage TA assignments
 */
export async function canManageTAAssignments(context: PermissionContext): Promise<boolean> {
  const userRole = context.userRole || await getUserRole(context.userId);
  
  // Both admins and head TAs can manage TA assignments
  return userRole === 'admin' || userRole === 'head_ta';
}

/**
 * Check if a user can view system statistics
 */
export async function canViewSystemStats(context: PermissionContext): Promise<boolean> {
  return hasAdminAccess(context.userId);
}

/**
 * Check if a user can export data
 */
export async function canExportData(context: PermissionContext): Promise<boolean> {
  return hasAdminAccess(context.userId);
}

/**
 * Check if a user can access the public directory
 */
export async function canAccessPublicDirectory(userId?: string): Promise<boolean> {
  // Public directory is accessible to all authenticated users
  return !!userId;
}

/**
 * Get a user's role
 */
async function getUserRole(userId: string): Promise<UserRole | null> {
  const user = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  return user.length > 0 ? (user[0].role as UserRole) : null;
}

/**
 * Permission middleware helper for API routes
 */
export async function requirePermission(
  userId: string,
  permission: 'admin' | 'manage_courses' | 'manage_tas' | 'send_invitations'
): Promise<{ allowed: boolean; reason?: string }> {
  const context = { userId };
  
  switch (permission) {
    case 'admin':
      const isAdmin = await hasAdminAccess(userId);
      return {
        allowed: isAdmin,
        reason: isAdmin ? undefined : 'Admin access required',
      };
    
    case 'manage_courses':
      const canCourses = await canManageCourses(context);
      return {
        allowed: canCourses,
        reason: canCourses ? undefined : 'Course management permission required',
      };
    
    case 'manage_tas':
      const canTAs = await canManageTAAssignments(context);
      return {
        allowed: canTAs,
        reason: canTAs ? undefined : 'TA management permission required',
      };
    
    case 'send_invitations':
      const invitePerms = await canSendInvitations(context);
      return {
        allowed: invitePerms.canSend,
        reason: invitePerms.canSend ? undefined : 'Invitation permission required',
      };
    
    default:
      return {
        allowed: false,
        reason: 'Unknown permission type',
      };
  }
}