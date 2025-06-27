import { Skeleton } from "@/components/ui/Skeleton";

export function DirectoryResultsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Results count */}
      <div className="flex justify-between items-center mb-8">
        <Skeleton variant="text" width={200} height={20} />
      </div>

      {/* Directory entries */}
      <div className="space-y-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-b border-charcoal/10 pb-8 last:border-0">
            <Skeleton variant="text" width="60%" height={32} className="mb-2" />
            <div className="space-y-1 mb-4">
              <Skeleton variant="text" width="30%" height={16} />
              <Skeleton variant="text" width="40%" height={16} />
              <Skeleton variant="text" width="25%" height={16} />
            </div>
            <div className="mt-4">
              <Skeleton variant="text" width={150} height={14} className="mb-2" />
              <div className="space-y-1">
                <Skeleton variant="text" width="90%" height={14} />
                <Skeleton variant="text" width="85%" height={14} />
                <Skeleton variant="text" width="75%" height={14} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}