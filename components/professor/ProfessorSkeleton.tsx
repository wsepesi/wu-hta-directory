import { Skeleton } from '@/components/ui/Skeleton';

export function ProfessorSkeleton() {
  return (
    <div className="border-t border-charcoal/20 pt-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-serif text-2xl text-charcoal mb-2">
            <Skeleton variant="text" width={200} height={32} />
          </h2>
          <div className="text-sm text-charcoal/60">
            <Skeleton variant="text" width={150} height={16} />
          </div>
        </div>
        <div className="text-right">
          <Skeleton variant="text" width={40} height={36} className="mb-1" />
          <Skeleton variant="text" width={80} height={12} />
        </div>
      </div>
      
      <div className="mb-4">
        <Skeleton variant="text" width={120} height={14} className="mb-2" />
        <div className="space-y-1">
          <Skeleton variant="text" width="80%" height={20} />
          <Skeleton variant="text" width="70%" height={20} />
        </div>
      </div>
      
      <div className="flex items-center space-x-8">
        <div>
          <Skeleton variant="text" width={30} height={24} className="mb-1" />
          <Skeleton variant="text" width={90} height={12} />
        </div>
        <div>
          <Skeleton variant="text" width={20} height={24} className="mb-1" />
          <Skeleton variant="text" width={70} height={12} />
        </div>
      </div>
    </div>
  );
}

export function ProfessorListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-12">
      {Array.from({ length: count }).map((_, i) => (
        <ProfessorSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfessorPageSkeleton() {
  return (
    <>
      {/* Search skeleton */}
      <section className="mb-12">
        <div className="max-w-2xl mx-auto">
          <Skeleton variant="text" width={150} height={16} className="mb-2" />
          <div className="flex">
            <Skeleton variant="rectangular" height={40} className="flex-1" />
            <Skeleton variant="rectangular" width={80} height={40} className="ml-6" />
          </div>
        </div>
      </section>

      {/* Results skeleton */}
      <section className="mb-16">
        <ProfessorListSkeleton />
      </section>
    </>
  );
}