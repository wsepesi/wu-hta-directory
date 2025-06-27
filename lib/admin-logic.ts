import { db } from './db';
import { users, courses, professors, courseOfferings, taAssignments, invitations, sessions } from './db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';

interface UserInvitationNode {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: Date;
  invitees: UserInvitationNode[];
}

interface SystemStats {
  totalUsers: number;
  totalAdmins: number;
  totalHeadTAs: number;
  totalCourses: number;
  totalProfessors: number;
  totalCourseOfferings: number;
  totalTAAssignments: number;
  activeSessions: number;
  pendingInvitations: number;
  recentActivity: {
    newUsersLastWeek: number;
    newUsersLastMonth: number;
    assignmentsLastWeek: number;
    assignmentsLastMonth: number;
  };
  courseStats: {
    coursesWithoutTAs: number;
    averageTAsPerCourse: number;
    mostPopularCourses: Array<{
      courseNumber: string;
      courseName: string;
      taCount: number;
    }>;
  };
  userStats: {
    averageTAWorkload: number;
    mostActiveUsers: Array<{
      name: string;
      email: string;
      assignmentCount: number;
    }>;
    topInviters: Array<{
      name: string;
      inviteCount: number;
    }>;
  };
}

interface DeletionCheckResult {
  canDelete: boolean;
  reasons: string[];
  dependencies: {
    taAssignments: number;
    invitationsSent: number;
    inviteesJoined: number;
    sessions: number;
  };
}

/**
 * Check if a user can be safely deleted
 */
export async function canDeleteUser(userId: string): Promise<DeletionCheckResult> {
  const reasons: string[] = [];
  
  // Check if user exists
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (user.length === 0) {
    return {
      canDelete: false,
      reasons: ['User not found'],
      dependencies: {
        taAssignments: 0,
        invitationsSent: 0,
        inviteesJoined: 0,
        sessions: 0,
      },
    };
  }
  
  // Check for TA assignments
  const assignments = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(taAssignments)
    .where(eq(taAssignments.userId, userId));
  
  const assignmentCount = assignments[0]?.count || 0;
  if (assignmentCount > 0) {
    reasons.push(`User has ${assignmentCount} TA assignment(s)`);
  }
  
  // Check for invitations sent
  const invitationsSent = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(invitations)
    .where(eq(invitations.invitedBy, userId));
  
  const invitationCount = invitationsSent[0]?.count || 0;
  if (invitationCount > 0) {
    reasons.push(`User has sent ${invitationCount} invitation(s)`);
  }
  
  // Check for users invited by this user
  const inviteesJoined = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(eq(users.invitedBy, userId));
  
  const inviteeCount = inviteesJoined[0]?.count || 0;
  if (inviteeCount > 0) {
    reasons.push(`User has invited ${inviteeCount} user(s) who joined`);
  }
  
  // Check for active sessions
  const activeSessions = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        gte(sessions.expires, new Date())
      )
    );
  
  const sessionCount = activeSessions[0]?.count || 0;
  if (sessionCount > 0) {
    reasons.push(`User has ${sessionCount} active session(s)`);
  }
  
  // Check if user is the last admin
  if (user[0].role === 'admin') {
    const adminCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.role, 'admin'));
    
    if (adminCount[0]?.count === 1) {
      reasons.push('Cannot delete the last administrator');
    }
  }
  
  return {
    canDelete: reasons.length === 0,
    reasons,
    dependencies: {
      taAssignments: assignmentCount,
      invitationsSent: invitationCount,
      inviteesJoined: inviteeCount,
      sessions: sessionCount,
    },
  };
}

/**
 * Get the invitation tree for a user
 */
export async function getUserInvitationTree(
  userId: string,
  maxDepth: number = 5
): Promise<UserInvitationNode | null> {
  async function buildTree(
    currentUserId: string,
    depth: number
  ): Promise<UserInvitationNode | null> {
    if (depth > maxDepth) return null;
    
    const user = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, currentUserId))
      .limit(1);
    
    if (user.length === 0) return null;
    
    const currentUser = user[0];
    
    // Get all users invited by this user
    const invitedUsers = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.invitedBy, currentUserId));
    
    const invitees: UserInvitationNode[] = [];
    
    // Recursively build tree for each invitee
    for (const invitee of invitedUsers) {
      const inviteeNode = await buildTree(invitee.id, depth + 1);
      if (inviteeNode) {
        invitees.push(inviteeNode);
      }
    }
    
    return {
      id: currentUser.id,
      name: `${currentUser.firstName} ${currentUser.lastName}`,
      email: currentUser.email,
      role: currentUser.role,
      joinedAt: currentUser.createdAt,
      invitees,
    };
  }
  
  return buildTree(userId, 0);
}

/**
 * Get comprehensive system statistics
 */
export async function getSystemStats(): Promise<SystemStats> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // User counts
  const userCounts = await db
    .select({
      total: sql<number>`COUNT(*)`,
      admins: sql<number>`COUNT(*) FILTER (WHERE role = 'admin')`,
      headTAs: sql<number>`COUNT(*) FILTER (WHERE role = 'head_ta')`,
    })
    .from(users);
  
  // Course and professor counts
  const courseCounts = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(courses);
  
  const professorCounts = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(professors);
  
  const offeringCounts = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(courseOfferings);
  
  const assignmentCounts = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(taAssignments);
  
  // Active sessions
  const sessionCounts = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(sessions)
    .where(gte(sessions.expires, now));
  
  // Pending invitations
  const invitationCounts = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(invitations)
    .where(
      and(
        gte(invitations.expiresAt, now),
        sql`${invitations.usedAt} IS NULL`
      )
    );
  
  // Recent activity
  const newUsersLastWeek = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(gte(users.createdAt, oneWeekAgo));
  
  const newUsersLastMonth = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(gte(users.createdAt, oneMonthAgo));
  
  const assignmentsLastWeek = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(taAssignments)
    .where(gte(taAssignments.createdAt, oneWeekAgo));
  
  const assignmentsLastMonth = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(taAssignments)
    .where(gte(taAssignments.createdAt, oneMonthAgo));
  
  // Courses without TAs
  const coursesWithoutTAs = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(courseOfferings)
    .leftJoin(taAssignments, eq(courseOfferings.id, taAssignments.courseOfferingId))
    .where(sql`${taAssignments.id} IS NULL`);
  
  // Average TAs per course
  const avgTAsPerCourse = await db
    .select({
      avg: sql<number>`AVG(ta_count)`,
    })
    .from(
      sql`(
        SELECT COUNT(${taAssignments.id}) as ta_count
        FROM ${courseOfferings}
        LEFT JOIN ${taAssignments} ON ${courseOfferings.id} = ${taAssignments.courseOfferingId}
        GROUP BY ${courseOfferings.id}
      ) as course_ta_counts`
    );
  
  // Most popular courses
  const popularCourses = await db
    .select({
      courseNumber: courses.courseNumber,
      courseName: courses.courseName,
      taCount: sql<number>`COUNT(DISTINCT ${taAssignments.userId})`,
    })
    .from(courses)
    .innerJoin(courseOfferings, eq(courses.id, courseOfferings.courseId))
    .innerJoin(taAssignments, eq(courseOfferings.id, taAssignments.courseOfferingId))
    .groupBy(courses.id, courses.courseNumber, courses.courseName)
    .orderBy(sql`COUNT(DISTINCT ${taAssignments.userId}) DESC`)
    .limit(5);
  
  // Average TA workload
  const avgWorkload = await db
    .select({
      avg: sql<number>`AVG(total_hours)`,
    })
    .from(
      sql`(
        SELECT SUM(COALESCE(${taAssignments.hoursPerWeek}, 10)) as total_hours
        FROM ${taAssignments}
        GROUP BY ${taAssignments.userId}
      ) as user_workloads`
    );
  
  // Most active users (by assignments)
  const activeUsers = await db
    .select({
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      assignmentCount: sql<number>`COUNT(${taAssignments.id})`,
    })
    .from(users)
    .innerJoin(taAssignments, eq(users.id, taAssignments.userId))
    .groupBy(users.id, users.firstName, users.lastName, users.email)
    .orderBy(sql`COUNT(${taAssignments.id}) DESC`)
    .limit(5);
  
  // Top inviters
  const topInviters = await db
    .select({
      firstName: users.firstName,
      lastName: users.lastName,
      inviteCount: sql<number>`COUNT(${invitations.id})`,
    })
    .from(users)
    .innerJoin(invitations, eq(users.id, invitations.invitedBy))
    .groupBy(users.id, users.firstName, users.lastName)
    .orderBy(sql`COUNT(${invitations.id}) DESC`)
    .limit(5);
  
  return {
    totalUsers: userCounts[0]?.total || 0,
    totalAdmins: userCounts[0]?.admins || 0,
    totalHeadTAs: userCounts[0]?.headTAs || 0,
    totalCourses: courseCounts[0]?.count || 0,
    totalProfessors: professorCounts[0]?.count || 0,
    totalCourseOfferings: offeringCounts[0]?.count || 0,
    totalTAAssignments: assignmentCounts[0]?.count || 0,
    activeSessions: sessionCounts[0]?.count || 0,
    pendingInvitations: invitationCounts[0]?.count || 0,
    recentActivity: {
      newUsersLastWeek: newUsersLastWeek[0]?.count || 0,
      newUsersLastMonth: newUsersLastMonth[0]?.count || 0,
      assignmentsLastWeek: assignmentsLastWeek[0]?.count || 0,
      assignmentsLastMonth: assignmentsLastMonth[0]?.count || 0,
    },
    courseStats: {
      coursesWithoutTAs: coursesWithoutTAs[0]?.count || 0,
      averageTAsPerCourse: avgTAsPerCourse[0]?.avg || 0,
      mostPopularCourses: popularCourses.map(c => ({
        courseNumber: c.courseNumber,
        courseName: c.courseName,
        taCount: c.taCount,
      })),
    },
    userStats: {
      averageTAWorkload: avgWorkload[0]?.avg || 0,
      mostActiveUsers: activeUsers.map(u => ({
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        assignmentCount: u.assignmentCount,
      })),
      topInviters: topInviters.map(u => ({
        name: `${u.firstName} ${u.lastName}`,
        inviteCount: u.inviteCount,
      })),
    },
  };
}