import CleanLayout, { CleanPageHeader } from "@/components/layout/CleanLayout";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SemestersLoading() {
  return (
    <CleanLayout maxWidth="6xl">
      <CleanPageHeader
        title="Browse by Semester"
        subtitle="Explore head TAs and courses across academic terms"
      />

      {/* Year Filter skeleton */}
      <div className="mb-16 border-b border-charcoal/10 pb-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Skeleton variant="text" width={100} height={14} />
          <Skeleton variant="rectangular" width={120} height={32} />
          <Skeleton variant="rectangular" width={80} height={32} />
        </div>
      </div>

      {/* Minimal Timeline skeleton */}
      <div className="space-y-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="block border-b border-charcoal/10 py-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-8">
              {/* Timeline marker and date skeleton */}
              <div className="sm:col-span-3 sm:text-right">
                <div className="font-serif">
                  <Skeleton variant="text" width={120} height={28} className="ml-auto" />
                </div>
              </div>
              
              {/* Vertical line and dot - hidden on mobile */}
              <div className="hidden sm:block sm:col-span-1 relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-charcoal/10"></div>
                <div className="absolute left-1/2 top-8 w-2 h-2 -ml-1 bg-charcoal/20 rounded-full"></div>
              </div>
              
              {/* Content skeleton */}
              <div className="sm:col-span-8">
                <div className="font-serif space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-4 sm:gap-8">
                    <div className="flex items-baseline">
                      <Skeleton variant="text" width={50} height={32} />
                      <Skeleton variant="text" width={80} height={14} className="ml-2" />
                    </div>
                    <div className="flex items-baseline">
                      <Skeleton variant="text" width={50} height={32} />
                      <Skeleton variant="text" width={80} height={14} className="ml-2" />
                    </div>
                  </div>
                  
                  <Skeleton variant="text" width={250} height={14} className="italic" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-24 pt-8 border-t border-charcoal/10 text-center">
        <Skeleton variant="text" width={100} height={14} className="mx-auto" />
      </div>
    </CleanLayout>
  );
}