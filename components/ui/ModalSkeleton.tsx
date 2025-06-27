import { clsx } from 'clsx';
import { Skeleton } from './Skeleton';

interface ModalSkeletonProps {
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function ModalSkeleton({ 
  className,
  showHeader = true,
  showFooter = true
}: ModalSkeletonProps) {
  return (
    <div className={clsx('bg-white rounded-lg shadow-xl overflow-hidden', className)}>
      {showHeader && (
        <div className="px-6 py-4 border-b border-gray-200">
          <Skeleton variant="text" className="h-6 w-48 mb-2" />
          <Skeleton variant="text" className="h-4 w-64" />
        </div>
      )}
      
      <div className="px-6 py-4">
        <div className="space-y-4">
          <Skeleton variant="rectangular" height={200} className="w-full" />
          <Skeleton variant="text" className="h-5 w-3/4" />
          <Skeleton variant="text" className="h-5 w-1/2" />
        </div>
      </div>
      
      {showFooter && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <Skeleton variant="rectangular" height={40} className="w-20" />
            <Skeleton variant="rectangular" height={40} className="w-24" />
          </div>
        </div>
      )}
    </div>
  );
}