import CleanLayout, { CleanPageHeader } from "@/components/layout/CleanLayout";
import { Skeleton } from "@/components/ui/Skeleton";

export default function PeopleLoading() {
  return (
    <CleanLayout maxWidth="6xl" center>
      <CleanPageHeader
        title="Head TA Directory"
        subtitle="Connect with current and former head TAs"
        description="Browse our complete directory of Washington University Computer Science head teaching assistants."
      />

      {/* Search and Filters skeleton */}
      <div className="bg-white border-t border-b border-charcoal/10 py-8 mb-12">
        <div className="space-y-6">
          <div>
            <Skeleton variant="text" width={80} height={14} className="mb-2" />
            <Skeleton variant="rectangular" height={48} />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <Skeleton variant="text" width={120} height={14} className="mb-2" />
              <Skeleton variant="rectangular" height={48} />
            </div>
            <div>
              <Skeleton variant="text" width={80} height={14} className="mb-2" />
              <Skeleton variant="rectangular" height={48} />
            </div>
          </div>

          <div className="flex justify-end space-x-6">
            <Skeleton variant="text" width={60} height={16} />
            <Skeleton variant="rectangular" width={120} height={44} />
          </div>
        </div>
      </div>

      {/* Results Count skeleton */}
      <div className="mb-8">
        <Skeleton variant="text" width={250} height={16} />
      </div>

      {/* Results List skeleton */}
      <div className="space-y-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-b border-charcoal/10 pb-8 last:border-0">
            <Skeleton variant="text" width="60%" height={28} className="mb-2" />
            <div className="space-y-1">
              <Skeleton variant="text" width={200} height={16} />
              <Skeleton variant="text" width={180} height={16} />
              <Skeleton variant="text" width={120} height={16} />
              <Skeleton variant="text" width={250} height={16} />
              <Skeleton variant="text" width={150} height={16} />
            </div>
            <Skeleton variant="rectangular" width={120} height={20} className="mt-4" />
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="mt-12 pt-8 border-t border-charcoal/10">
        <nav className="flex items-center justify-between">
          <Skeleton variant="text" width={80} height={16} />
          <Skeleton variant="text" width={100} height={16} />
          <Skeleton variant="text" width={60} height={16} />
        </nav>
      </div>

      <div className="mt-16">
        <nav className="flex justify-center space-x-12">
          <Skeleton variant="text" width={100} height={14} />
          <Skeleton variant="text" width={120} height={14} />
        </nav>
      </div>
    </CleanLayout>
  );
}