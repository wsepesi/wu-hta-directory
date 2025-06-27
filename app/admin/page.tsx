import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-utils";
import Link from "next/link";
import { Suspense } from "react";
import DashboardStatsServer from "@/components/admin/DashboardStatsServer";
import DashboardStatsSkeleton from "@/components/admin/DashboardStatsSkeleton";
import ActivityTrackerServer from "@/components/admin/ActivityTrackerServer";
import UserGrowthChartServer from "@/components/admin/UserGrowthChartServer";
import AdminReports from "@/components/admin/AdminReports";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql, isNotNull, desc } from "drizzle-orm";
import { Skeleton } from "@/components/ui/Skeleton";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Admin Dashboard - WU Head TA Directory",
  description: "Administrator dashboard for the Head TA Directory",
};

// Separate data fetching functions for parallel loading
async function getRecentUsers() {
  const recentUsers = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(5);
  return recentUsers;
}

async function getUsersByYear() {
  const usersByYear = await db
    .select({
      gradYear: users.gradYear,
      count: sql<number>`count(*)`,
    })
    .from(users)
    .where(isNotNull(users.gradYear))
    .groupBy(users.gradYear)
    .orderBy(desc(users.gradYear));
  return usersByYear;
}

// Activity Tracker Skeleton
function ActivityTrackerSkeleton() {
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <Skeleton variant="text" width="140px" height="24px" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="flex items-start space-x-3">
            <Skeleton variant="circular" width={32} height={32} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="80%" height="16px" />
              <Skeleton variant="text" width="120px" height="14px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// User Growth Chart Skeleton
function UserGrowthChartSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <Skeleton variant="text" width="200px" height="24px" />
        <Skeleton variant="text" width="100px" height="16px" />
      </div>
      <Skeleton variant="rectangular" width="100%" height="200px" className="mb-4" />
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        {[1, 2].map((i) => (
          <div key={i}>
            <Skeleton variant="text" width="120px" height="16px" className="mb-2" />
            <Skeleton variant="text" width="48px" height="32px" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  
  // Start all data fetching in parallel
  const [recentUsersData, usersByYearData] = await Promise.all([
    getRecentUsers(),
    getUsersByYear(),
  ]);

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
        <Suspense fallback={<DashboardStatsSkeleton />}>
          <DashboardStatsServer />
        </Suspense>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
              href="/admin/unclaimed-profiles"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Unclaimed Profiles
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
          <Suspense fallback={<UserGrowthChartSkeleton />}>
            <UserGrowthChartServer />
          </Suspense>
          
          {/* Activity Feed */}
          <div className="bg-white shadow rounded-lg p-6">
            <Suspense fallback={<ActivityTrackerSkeleton />}>
              <ActivityTrackerServer />
            </Suspense>
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
                {recentUsersData.map((user) => (
                  <li key={user.id}>
                    <Link
                      href={`/profile/${user.id}`}
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
              {usersByYearData.length > 0 ? (
                <div className="space-y-3">
                  {usersByYearData.slice(0, 10).map((yearData) => (
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