import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <Skeleton variant="text" width="96px" height="16px" className="mb-2" />
            <Skeleton variant="text" width="64px" height="32px" className="mb-2" />
            <Skeleton variant="text" width="120px" height="14px" />
          </div>
        </div>
      ))}
    </div>
  );
}