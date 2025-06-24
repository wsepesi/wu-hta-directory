import { clsx } from 'clsx';

interface SkeletonLoaderProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
  animation?: 'pulse' | 'wave';
}

export function SkeletonLoader({
  variant = 'text',
  width,
  height,
  className,
  count = 1,
  animation = 'pulse',
}: SkeletonLoaderProps) {
  const baseStyles = 'bg-gray-200';
  
  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
  };

  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    card: 'rounded-lg',
  };

  const getSize = () => {
    switch (variant) {
      case 'circular':
        return { width: width || 40, height: height || 40 };
      case 'rectangular':
        return { width: width || '100%', height: height || 120 };
      case 'card':
        return { width: width || '100%', height: height || 200 };
      default:
        return { width: width || '100%', height: height || 16 };
    }
  };

  const { width: w, height: h } = getSize();

  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={clsx(
        baseStyles,
        animationStyles[animation],
        variantStyles[variant],
        className
      )}
      style={{
        width: typeof w === 'number' ? `${w}px` : w,
        height: typeof h === 'number' ? `${h}px` : h,
      }}
    />
  ));

  return count > 1 ? (
    <div className="space-y-3">{skeletons}</div>
  ) : (
    skeletons[0]
  );
}

// Specialized skeleton components for common use cases
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('bg-white rounded-lg shadow p-6', className)}>
      <div className="flex items-center space-x-4 mb-4">
        <SkeletonLoader variant="circular" width={48} height={48} />
        <div className="flex-1">
          <SkeletonLoader width="60%" height={20} className="mb-2" />
          <SkeletonLoader width="40%" height={16} />
        </div>
      </div>
      <SkeletonLoader count={3} className="mb-2" />
      <div className="flex justify-between items-center mt-4">
        <SkeletonLoader width={80} height={32} variant="rectangular" />
        <SkeletonLoader width={60} height={20} />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-200">
      {Array.from({ length: columns }, (_, i) => (
        <td key={i} className="px-6 py-4">
          <SkeletonLoader />
        </td>
      ))}
    </tr>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 border-b border-gray-200">
      <SkeletonLoader variant="circular" width={40} height={40} />
      <div className="flex-1">
        <SkeletonLoader width="70%" className="mb-2" />
        <SkeletonLoader width="50%" height={14} />
      </div>
      <SkeletonLoader width={60} height={24} variant="rectangular" />
    </div>
  );
}