import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { userRepository } from "@/lib/repositories/users";
import { courseRepository } from "@/lib/repositories/courses";
import { professorRepository } from "@/lib/repositories/professors";
import { taAssignmentRepository } from "@/lib/repositories/hta-records";
import { invitationRepository } from "@/lib/repositories/invitations";
import { db } from "@/lib/db";
import { users, taAssignments, sessions } from "@/lib/db/schema";
import { sql, gte, and } from "drizzle-orm";
import StatsCard from "./StatsCard";

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

async function getStats() {
  // Check authentication and admin role
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const currentUser = await userRepository.findById(session.user.id);
  if (!currentUser || currentUser.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
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

  return {
    totalUsers,
    totalCourses,
    totalProfessors,
    totalAssignments,
    pendingInvitations,
    activeUsers,
    userGrowth,
    assignmentGrowth,
  };
}

export default async function DashboardStatsServer() {
  const stats = await getStats();

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Users"
        value={stats.totalUsers}
        description={`${stats.activeUsers} active`}
        trend={stats.userGrowth}
        color="indigo"
      />
      <StatsCard
        title="Total Courses"
        value={stats.totalCourses}
        color="green"
      />
      <StatsCard
        title="TA Assignments"
        value={stats.totalAssignments}
        trend={stats.assignmentGrowth}
        color="purple"
      />
      <StatsCard
        title="Pending Invites"
        value={stats.pendingInvitations}
        color="yellow"
      />
    </div>
  );
}