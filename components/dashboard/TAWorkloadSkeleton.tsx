import { Skeleton } from '@/components/ui/Skeleton';

export function TAWorkloadSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <Skeleton variant="text" width="120px" height="24px" />
      </div>
      
      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton variant="text" width="48px" height="32px" className="mx-auto mb-2" />
              <Skeleton variant="text" width="80px" height="16px" className="mx-auto" />
            </div>
          ))}
        </div>

        {/* Average Utilization */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Skeleton variant="text" width="140px" height="16px" />
            <Skeleton variant="text" width="48px" height="16px" />
          </div>
          <Skeleton variant="rectangular" width="100%" height="8px" className="rounded-full" />
        </div>

        {/* Top Workloads */}
        <div>
          <Skeleton variant="text" width="120px" height="16px" className="mb-3" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <Skeleton variant="text" width="150px" height="16px" className="mr-2" />
                  <Skeleton variant="text" width="80px" height="14px" />
                </div>
                <Skeleton variant="rectangular" width="60px" height="24px" className="rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}