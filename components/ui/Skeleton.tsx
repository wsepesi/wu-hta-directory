import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const variantStyles = {
    text: '',
    circular: '',
    rectangular: '',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const baseStyles = 'bg-charcoal/10';

  // Default heights for text variant
  const defaultHeight = variant === 'text' ? 'h-4' : '';

  return (
    <div
      className={clsx(
        baseStyles,
        variantStyles[variant],
        animationStyles[animation],
        defaultHeight,
        className
      )}
      style={{
        width: width,
        height: height,
      }}
    />
  );
}

// Skeleton components for common UI patterns
export function SkeletonCard({ 
  className,
  children 
}: { 
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={clsx('p-6 bg-white border border-charcoal rounded-lg', className)}>
      {children || (
        <>
          <Skeleton variant="rectangular" height={200} className="mb-4" />
          <Skeleton variant="text" className="mb-2" />
          <Skeleton variant="text" width="60%" />
        </>
      )}
    </div>
  );
}

export function SkeletonList({ 
  count = 3, 
  className 
}: { 
  count?: number; 
  className?: string 
}) {
  return (
    <div className={clsx('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-white border border-charcoal rounded-lg">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1">
            <Skeleton variant="text" className="mb-2" />
            <Skeleton variant="text" width="75%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ 
  rows = 5, 
  columns = 4,
  className 
}: { 
  rows?: number; 
  columns?: number;
  className?: string 
}) {
  return (
    <div className={clsx('bg-white border border-charcoal rounded-lg overflow-hidden', className)}>
      <table className="min-w-full">
        <thead className="bg-white border-b border-charcoal">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-3">
                <Skeleton variant="text" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-charcoal/20">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <Skeleton variant="text" width={colIndex === 0 ? '100%' : '80%'} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}