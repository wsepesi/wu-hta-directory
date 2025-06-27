import { Skeleton } from "@/components/ui/Skeleton";

export function DirectoryStatsSkeleton() {
  return (
    <div className="bg-charcoal/5 border border-charcoal/10 p-6 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div>
          <Skeleton variant="text" width={60} height={36} className="mx-auto mb-1" />
          <Skeleton variant="text" width={80} height={14} className="mx-auto" />
        </div>
        <div>
          <Skeleton variant="text" width={60} height={36} className="mx-auto mb-1" />
          <Skeleton variant="text" width={80} height={14} className="mx-auto" />
        </div>
        <div>
          <Skeleton variant="text" width={60} height={36} className="mx-auto mb-1" />
          <Skeleton variant="text" width={100} height={14} className="mx-auto" />
        </div>
      </div>
    </div>
  );
}