import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userRepository } from '@/lib/repositories/users';
import { courseRepository } from '@/lib/repositories/courses';
import { professorRepository } from '@/lib/repositories/professors';
import { taAssignmentRepository } from '@/lib/repositories/hta-records';
import { invitationRepository } from '@/lib/repositories/invitations';
import { db } from '@/lib/db';
import { users, taAssignments, sessions } from '@/lib/db/schema';
import { sql, gte, and, isNotNull } from 'drizzle-orm';
import type { ApiResponse } from '@/lib/types';

// Helper function to calculate growth percentage
function calculateGrowth(previous: number, current: number) {
  if (previous === 0) {
    return { value: current > 0 ? 100 : 0, isPositive: current > 0 };
  }
  const percentChange = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(percentChange)),
    isPositive: percentChange >= 0
  };
}

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics (admin only)
 */
export async function GET() {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const currentUser = await userRepository.findById(session.user.id);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Get total counts
    const totalUsers = await userRepository.count();
    const totalCourses = await courseRepository.count();
    const totalProfessors = await professorRepository.count();
    const totalAssignments = await taAssignmentRepository.count();
    const pendingInvitations = await invitationRepository.countPending();

    // Get active users (users with sessions in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsersResult = await db
      .selectDistinct({ userId: sessions.userId })
      .from(sessions)
      .where(gte(sessions.createdAt, thirtyDaysAgo));
    
    const activeUsers = activeUsersResult.length;

    // Calculate growth metrics (compare with previous 30 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const previousMonthUsers = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(
        and(
          gte(users.createdAt, sixtyDaysAgo),
          sql`${users.createdAt} < ${thirtyDaysAgo}`
        )
      );
    
    const currentMonthUsers = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo));

    const previousMonthAssignments = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(taAssignments)
      .where(
        and(
          gte(taAssignments.createdAt, sixtyDaysAgo),
          sql`${taAssignments.createdAt} < ${thirtyDaysAgo}`
        )
      );
    
    const currentMonthAssignments = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(taAssignments)
      .where(gte(taAssignments.createdAt, thirtyDaysAgo));

    // Calculate growth percentages
    const userGrowth = calculateGrowth(
      previousMonthUsers[0]?.count || 0,
      currentMonthUsers[0]?.count || 0
    );
    
    const assignmentGrowth = calculateGrowth(
      previousMonthAssignments[0]?.count || 0,
      currentMonthAssignments[0]?.count || 0
    );

    // Get users by graduation year
    const usersByGradYearResult = await db
      .select({
        gradYear: users.gradYear,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .where(isNotNull(users.gradYear))
      .groupBy(users.gradYear)
      .orderBy(users.gradYear);

    const usersByGradYear: Record<number, number> = {};
    usersByGradYearResult.forEach(row => {
      if (row.gradYear) {
        usersByGradYear[row.gradYear] = row.count;
      }
    });

    // Get users by location
    const usersByLocationResult = await db
      .select({
        location: users.location,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .where(isNotNull(users.location))
      .groupBy(users.location)
      .orderBy(users.location);

    const usersByLocation: Record<string, number> = {};
    usersByLocationResult.forEach(row => {
      if (row.location) {
        usersByLocation[row.location] = row.count;
      }
    });

    const stats = {
      totalUsers,
      totalCourses,
      totalProfessors,
      totalAssignments,
      pendingInvitations,
      activeUsers,
      userGrowth,
      assignmentGrowth,
      usersByGradYear,
      usersByLocation,
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' } as ApiResponse<never>,
      { status: 500 }
    );
  }
}