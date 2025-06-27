import { Skeleton } from '@/components/ui/Skeleton';
import { NavigationWithSearch } from '@/components/layout/NavigationWithSearch';

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation skeleton */}
      <NavigationWithSearch />
      
      {/* Page content skeleton */}
      <div className="max-w-4xl mx-auto px-8 py-16">
        {/* Page header skeleton */}
        <div className="mb-16 space-y-6">
          <Skeleton variant="text" className="h-10 w-3/4 mx-auto" />
          <Skeleton variant="text" className="h-6 w-1/2 mx-auto" />
          <div className="space-y-2 max-w-2xl mx-auto">
            <Skeleton variant="text" className="h-5" />
            <Skeleton variant="text" className="h-5" />
            <Skeleton variant="text" className="h-5 w-4/5" />
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-charcoal p-6">
                <Skeleton variant="rectangular" height={120} className="mb-4" />
                <Skeleton variant="text" className="mb-2" />
                <Skeleton variant="text" width="75%" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}