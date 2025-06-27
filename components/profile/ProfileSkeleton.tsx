import { Skeleton } from '@/components/ui/Skeleton';
import { clsx } from 'clsx';

interface ProfileSkeletonProps {
  className?: string;
}

// Full profile page skeleton
export function ProfileSkeleton({ className }: ProfileSkeletonProps) {
  return (
    <div className={clsx('min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8', className)}>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <Skeleton variant="text" width={200} height={32} className="mb-2" />
              <Skeleton variant="text" width={150} height={20} />
            </div>
            <div className="flex space-x-3">
              <Skeleton variant="rectangular" width={120} height={40} />
              <Skeleton variant="rectangular" width={140} height={40} />
            </div>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              {/* Profile fields */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton variant="text" width={100} height={16} className="mb-1" />
                  <Skeleton variant="text" width={150} height={20} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TA Assignment History */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <Skeleton variant="text" width={200} height={24} className="mb-1" />
            <Skeleton variant="text" width={100} height={16} />
          </div>
          
          <div className="border-t border-gray-200">
            {Array.from({ length: 2 }).map((_, semesterIndex) => (
              <div key={semesterIndex} className="px-4 py-5 sm:px-6">
                <Skeleton variant="text" width={120} height={16} className="mb-3" />
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, courseIndex) => (
                    <div key={courseIndex} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Skeleton variant="text" width="80%" height={20} className="mb-2" />
                          <Skeleton variant="text" width="60%" height={16} className="mb-1" />
                          <Skeleton variant="text" width="40%" height={16} />
                        </div>
                        <Skeleton variant="text" width={100} height={16} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile edit form skeleton
export function ProfileEditSkeleton({ className }: ProfileSkeletonProps) {
  return (
    <div className={clsx('min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8', className)}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <Skeleton variant="text" width={150} height={32} className="mb-6" />
            
            {/* Profile Image Upload Section */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <ProfileImageUploadSkeleton />
            </div>
            
            {/* Form sections */}
            {Array.from({ length: 4 }).map((_, sectionIndex) => (
              <div key={sectionIndex} className="mb-6">
                <Skeleton variant="text" width={180} height={24} className="mb-4" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, fieldIndex) => (
                    <div key={fieldIndex}>
                      <Skeleton variant="text" width={80} height={16} className="mb-1" />
                      <Skeleton variant="rectangular" height={40} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Form Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <Skeleton variant="rectangular" width={80} height={40} />
              <Skeleton variant="rectangular" width={120} height={40} />
            </div>
          </div>
        </div>

        {/* Privacy Settings Section */}
        <div className="mt-8 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <Skeleton variant="text" width={150} height={24} className="mb-4" />
            <PrivacySettingsSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile image upload skeleton
export function ProfileImageUploadSkeleton({ className }: ProfileSkeletonProps) {
  return (
    <div className={clsx('space-y-4', className)}>
      <Skeleton variant="text" width={120} height={24} />
      
      <div className="flex items-center space-x-6">
        <div className="flex-shrink-0">
          <Skeleton variant="circular" width={96} height={96} />
        </div>
        
        <div className="flex-1">
          <div className="space-y-3">
            <div>
              <Skeleton variant="text" width={80} height={16} className="mb-1" />
              <Skeleton variant="rectangular" height={40} />
            </div>
            <Skeleton variant="rectangular" width={120} height={40} />
          </div>
        </div>
      </div>
      
      <Skeleton variant="rectangular" height={80} />
    </div>
  );
}

// Privacy settings skeleton
export function PrivacySettingsSkeleton({ className }: ProfileSkeletonProps) {
  return (
    <div className={clsx('bg-white shadow rounded-lg p-6', className)}>
      <Skeleton variant="text" width={150} height={24} className="mb-6" />
      
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-start">
            <div className="flex items-center h-5">
              <Skeleton variant="rectangular" width={16} height={16} />
            </div>
            <div className="ml-3 flex-1">
              <Skeleton variant="text" width={140} height={16} className="mb-1" />
              <Skeleton variant="text" width="80%" height={14} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Skeleton variant="rectangular" width={160} height={40} />
      </div>
    </div>
  );
}

// User card skeleton for lists
export function UserCardSkeleton({ className }: ProfileSkeletonProps) {
  return (
    <div className={clsx('bg-white border border-gray-200 rounded-lg p-4', className)}>
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1">
          <Skeleton variant="text" width={150} height={20} className="mb-1" />
          <Skeleton variant="text" width={100} height={16} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Skeleton variant="text" width="90%" height={14} />
        <Skeleton variant="text" width="90%" height={14} />
        <Skeleton variant="text" width="90%" height={14} />
        <Skeleton variant="text" width="90%" height={14} />
      </div>
    </div>
  );
}

// Simple loading state for inline components
export function ProfileLoadingState({ className }: ProfileSkeletonProps) {
  return (
    <div className={clsx('flex items-center justify-center py-4', className)}>
      <Skeleton variant="text" width={100} height={20} />
    </div>
  );
}

// TA Card skeleton
export function TACardSkeleton({ className }: ProfileSkeletonProps) {
  return (
    <div className={clsx('bg-white border border-gray-200 rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton variant="circular" width={64} height={64} />
          <div className="flex-1">
            <Skeleton variant="text" width={150} height={24} className="mb-1" />
            <Skeleton variant="text" width={200} height={16} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-4">
        <Skeleton variant="text" width="100%" height={16} className="mb-2" />
        <Skeleton variant="text" width="80%" height={16} className="mb-4" />
        
        <div className="space-y-2">
          <Skeleton variant="text" width={120} height={16} className="mb-2" />
          <div className="flex flex-wrap gap-2">
            <Skeleton variant="rectangular" width={60} height={24} />
            <Skeleton variant="rectangular" width={80} height={24} />
            <Skeleton variant="rectangular" width={70} height={24} />
          </div>
        </div>

        <div className="mt-3">
          <Skeleton variant="text" width={100} height={16} className="mb-1" />
          <Skeleton variant="text" width="90%" height={16} />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex gap-2">
          <Skeleton variant="rectangular" height={32} className="flex-1" />
          <Skeleton variant="rectangular" height={32} className="flex-1" />
        </div>
      </div>
    </div>
  );
}