import CleanLayout from "@/components/layout/CleanLayout";

export default function CourseDetailLoading() {
  return (
    <CleanLayout maxWidth="7xl">
      {/* Header skeleton */}
      <div className="mb-12">
        <div className="h-4 w-32 bg-charcoal/10 rounded mb-8 animate-pulse" />
        <div className="h-10 w-3/4 bg-charcoal/10 rounded mb-4 animate-pulse" />
        <div className="flex space-x-4">
          <div className="h-4 w-32 bg-charcoal/10 rounded animate-pulse" />
          <div className="h-4 w-40 bg-charcoal/10 rounded animate-pulse" />
          <div className="h-4 w-28 bg-charcoal/10 rounded animate-pulse" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <div className="h-12 w-16 bg-charcoal/10 rounded mx-auto mb-2 animate-pulse" />
            <div className="h-4 w-24 bg-charcoal/10 rounded mx-auto animate-pulse" />
          </div>
        ))}
      </div>

      {/* Timeline skeleton */}
      <div className="mb-12">
        <div className="h-8 w-48 bg-charcoal/10 rounded mb-6 animate-pulse" />
        <div className="h-64 bg-charcoal/5 rounded animate-pulse" />
      </div>

      {/* Detailed history skeleton */}
      <div className="mb-12">
        <div className="h-8 w-48 bg-charcoal/10 rounded mb-6 animate-pulse" />
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-6 w-48 bg-charcoal/10 rounded mb-4 animate-pulse" />
              <div className="space-y-6">
                {[1, 2].map((j) => (
                  <div key={j} className="border-l-2 border-charcoal/20 pl-6">
                    <div className="h-5 w-32 bg-charcoal/10 rounded mb-2 animate-pulse" />
                    <div className="h-4 w-48 bg-charcoal/10 rounded mb-2 animate-pulse" />
                    <div className="h-4 w-64 bg-charcoal/10 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All TAs skeleton */}
      <div className="border-t border-charcoal/10 pt-12">
        <div className="h-8 w-32 bg-charcoal/10 rounded mb-2 animate-pulse" />
        <div className="h-4 w-96 bg-charcoal/10 rounded mb-8 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between border-b border-charcoal/10 pb-4">
              <div>
                <div className="h-5 w-32 bg-charcoal/10 rounded mb-2 animate-pulse" />
                <div className="h-4 w-48 bg-charcoal/10 rounded animate-pulse" />
              </div>
              <div className="h-5 w-5 bg-charcoal/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </CleanLayout>
  );
}