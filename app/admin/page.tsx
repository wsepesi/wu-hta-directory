import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-utils";
import Link from "next/link";
import DashboardStats from "@/components/admin/DashboardStats";
import ActivityTracker from "@/components/admin/ActivityTracker";
import UserGrowthChart from "@/components/admin/UserGrowthChart";
import AdminReports from "@/components/admin/AdminReports";
import { db } from "@/lib/db";
import { users, courses, professors, taAssignments, invitations, courseOfferings } from "@/lib/db/schema";
import { sql, and, gt, isNull, desc, eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Admin Dashboard - WU Head TA Directory",
  description: "Administrator dashboard for the Head TA Directory",
};

async function getAdminStats() {
  // Get counts
  const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
  const courseCount = await db.select({ count: sql<number>`count(*)` }).from(courses);
  const professorCount = await db.select({ count: sql<number>`count(*)` }).from(professors);
  const assignmentCount = await db.select({ count: sql<number>`count(*)` }).from(taAssignments);
  
  // Get pending invitations
  const pendingInvites = await db
    .select({ count: sql<number>`count(*)` })
    .from(invitations)
    .where(and(gt(invitations.expiresAt, new Date()), isNull(invitations.usedAt)));

  // Get recent users
  const recentUsers = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(5);

  // Get user distribution by grad year
  const usersByYear = await db
    .select({
      gradYear: users.gradYear,
      count: sql<number>`count(*)`,
    })
    .from(users)
    .where(users.gradYear !== null)
    .groupBy(users.gradYear)
    .orderBy(desc(users.gradYear));

  return {
    totalUsers: userCount[0].count,
    totalCourses: courseCount[0].count,
    totalProfessors: professorCount[0].count,
    totalAssignments: assignmentCount[0].count,
    pendingInvitations: pendingInvites[0].count,
    recentUsers,
    usersByYear,
  };
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const stats = await getAdminStats();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            System overview and administration tools
          </p>
        </div>

        {/* Real-time Stats Overview */}
        <DashboardStats />

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/users"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Manage Users
            </Link>
            <Link
              href="/admin/invitations"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              View Invitations
            </Link>
            <Link
              href="/manage/courses"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Manage Courses
            </Link>
            <Link
              href="/auth/invite"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Send Invitation
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-8">
          {/* User Growth Chart */}
          <UserGrowthChart />
          
          {/* Activity Feed */}
          <div className="bg-white shadow rounded-lg p-6">
            <ActivityTracker />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Recent Users */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Recent Users</h2>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {stats.recentUsers.map((user) => (
                  <li key={user.id}>
                    <Link
                      href={`/people/${user.id}`}
                      className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-3 sm:px-6">
                <Link
                  href="/admin/users"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  View all users →
                </Link>
              </div>
            </div>
          </div>

          {/* Users by Graduation Year */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Users by Graduation Year</h2>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              {stats.usersByYear.length > 0 ? (
                <div className="space-y-3">
                  {stats.usersByYear.slice(0, 10).map((yearData) => (
                    <div key={yearData.gradYear} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">
                        Class of {yearData.gradYear}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {yearData.count} users
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No graduation year data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Admin Reports Section */}
        <div className="mt-8">
          <AdminReports />
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}