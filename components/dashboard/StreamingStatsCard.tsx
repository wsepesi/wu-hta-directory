import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

interface StatsCardProps {
  value: number | string;
  label: string;
  sublabel?: string;
  className?: string;
}

// Individual stat card skeleton
function StatCardSkeleton() {
  return (
    <div className="text-center">
      <Skeleton variant="text" width="60px" height="48px" className="mx-auto mb-2" />
      <Skeleton variant="text" width="120px" height="16px" className="mx-auto mb-1" />
      <Skeleton variant="text" width="100px" height="14px" className="mx-auto" />
    </div>
  );
}

// Server component for individual stat
async function StatCard({ value, label, sublabel, className = "" }: StatsCardProps) {
  return (
    <div className="text-center">
      <p className={`font-serif text-5xl mb-2 ${className}`}>
        {value}
      </p>
      <p className="text-sm uppercase tracking-wider text-charcoal/60">
        {label}
      </p>
      {sublabel && (
        <p className="font-serif text-sm text-charcoal/80 mt-1">
          {sublabel}
        </p>
      )}
    </div>
  );
}

// Streaming wrapper for each stat card
export function StreamingStatsCard(props: StatsCardProps) {
  return (
    <Suspense fallback={<StatCardSkeleton />}>
      <StatCard {...props} />
    </Suspense>
  );
}