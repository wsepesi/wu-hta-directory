import { Skeleton } from "@/components/ui/Skeleton";

export function DirectoryFiltersSkeleton() {
  return (
    <div className="bg-white border-t border-b border-charcoal/10 py-8 mb-12">
      <Skeleton variant="text" width={150} height={24} className="mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Skeleton variant="rectangular" height={48} />
        <Skeleton variant="rectangular" height={48} />
        <Skeleton variant="rectangular" height={48} />
        <Skeleton variant="rectangular" height={48} />
      </div>
    </div>
  );
}