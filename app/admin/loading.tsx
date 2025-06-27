import { Skeleton } from "@/components/ui/Skeleton";
import DashboardStatsSkeleton from "@/components/admin/DashboardStatsSkeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Skeleton variant="text" width={250} height={36} className="mb-2" />
          <Skeleton variant="text" width={350} height={16} />
        </div>

        {/* Real-time Stats Overview skeleton */}
        <DashboardStatsSkeleton />

        {/* Quick Actions skeleton */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <Skeleton variant="text" width={150} height={20} className="mb-4" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={40} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-8">
          {/* User Growth Chart skeleton */}
          <div className="bg-white shadow rounded-lg p-6">
            <Skeleton variant="text" width={180} height={20} className="mb-4" />
            <Skeleton variant="rectangular" height={300} />
          </div>
          
          {/* Activity Feed skeleton */}
          <div className="bg-white shadow rounded-lg p-6">
            <Skeleton variant="text" width={150} height={20} className="mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i}>
                  <Skeleton variant="text" width="100%" height={16} />
                  <Skeleton variant="text" width="60%" height={14} className="mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Recent Users skeleton */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <Skeleton variant="text" width={120} height={20} />
            </div>
            <div className="border-t border-gray-200">
              <div className="divide-y divide-gray-200">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Skeleton variant="text" width={150} height={16} className="mb-1" />
                        <Skeleton variant="text" width={200} height={14} />
                      </div>
                      <Skeleton variant="text" width={80} height={14} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 sm:px-6">
                <Skeleton variant="text" width={100} height={14} />
              </div>
            </div>
          </div>

          {/* Users by Graduation Year skeleton */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <Skeleton variant="text" width={200} height={20} />
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton variant="text" width={100} height={16} />
                    <Skeleton variant="text" width={80} height={16} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Reports Section skeleton */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <Skeleton variant="text" width={150} height={20} className="mb-4" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded p-4">
                <Skeleton variant="text" width={180} height={18} className="mb-2" />
                <Skeleton variant="text" width="100%" height={14} />
                <Skeleton variant="text" width="80%" height={14} className="mt-1" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Skeleton variant="text" width={120} height={14} className="mx-auto" />
        </div>
      </div>
    </div>
  );
}