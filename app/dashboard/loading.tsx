import CleanLayout, { CleanPageHeader } from "@/components/layout/CleanLayout";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <CleanLayout maxWidth="7xl">
      <CleanPageHeader
        title="TA Dashboard"
        subtitle=""
        description="Current statistics and courses needing Head TAs"
      />
      
      {/* Subtitle skeleton */}
      <div className="text-center -mt-10 mb-16">
        <Skeleton variant="text" width={200} height={20} className="mx-auto" />
      </div>

      {/* Quick Actions skeleton - for authenticated admins */}
      <section className="mb-16">
        <Skeleton variant="text" width={150} height={28} className="mb-8" />
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-t border-charcoal pt-4">
              <Skeleton variant="text" width="80%" height={20} className="mb-2" />
              <Skeleton variant="text" width="100%" height={14} />
              <Skeleton variant="text" width="60%" height={14} className="mt-1" />
            </div>
          ))}
        </div>
      </section>

      {/* Statistics Overview skeleton */}
      <section className="mb-16">
        <Skeleton variant="text" width={200} height={28} className="mb-8" />
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton variant="text" width={80} height={48} className="mx-auto mb-2" />
              <Skeleton variant="text" width={120} height={12} className="mx-auto" />
              <Skeleton variant="text" width={100} height={12} className="mx-auto mt-1" />
            </div>
          ))}
        </div>
      </section>

      {/* Missing TAs Widget skeleton */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <Skeleton variant="text" width={250} height={28} />
          <Skeleton variant="text" width={150} height={14} />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-charcoal/20 p-6">
              <Skeleton variant="text" width="70%" height={24} className="mb-2" />
              <Skeleton variant="text" width="50%" height={16} className="mb-4" />
              <Skeleton variant="rectangular" width={120} height={40} />
            </div>
          ))}
        </div>
      </section>

      {/* Navigation Links skeleton */}
      <section>
        <Skeleton variant="text" width={100} height={28} className="mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="text" width={200} height={20} />
          ))}
        </div>
      </section>
    </CleanLayout>
  );
}