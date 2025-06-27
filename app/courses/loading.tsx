import CleanLayout, { CleanPageHeader } from "@/components/layout/CleanLayout";
import { Skeleton } from "@/components/ui/Skeleton";

export default function CoursesLoading() {
  return (
    <CleanLayout maxWidth="7xl">
      <CleanPageHeader
        title="Course Directory"
        description="Explore all courses with head TA support"
      />

      {/* Search and Filters skeleton */}
      <div className="mb-12">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Skeleton variant="text" width={80} height={14} className="mb-2" />
              <Skeleton variant="rectangular" height={40} />
            </div>
            <div>
              <Skeleton variant="text" width={120} height={14} className="mb-2" />
              <Skeleton variant="rectangular" height={40} />
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <Skeleton variant="text" width={60} height={32} />
            <Skeleton variant="rectangular" width={100} height={40} />
          </div>
        </div>
      </div>

      {/* Course list skeleton */}
      <div className="space-y-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-b border-charcoal/10 pb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="font-serif text-2xl text-charcoal mb-2">
                  <Skeleton variant="text" width="60%" height={28} />
                </h2>
                <div className="font-serif text-sm text-charcoal/70 space-y-1">
                  <Skeleton variant="text" width={200} height={16} />
                  <Skeleton variant="text" width={250} height={16} />
                  <Skeleton variant="text" width={180} height={16} />
                </div>
              </div>
              <div className="text-right">
                <Skeleton variant="rectangular" width={100} height={28} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </CleanLayout>
  );
}