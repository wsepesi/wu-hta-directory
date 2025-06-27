import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton';
import { clsx } from 'clsx';

// Course Management Table Skeleton
export function CourseManagementSkeleton() {
  return (
    <div className="space-y-8">
      {/* Tab Navigation Skeleton */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {['Courses', 'Professors', 'Course Offerings'].map((_, i) => (
            <div key={i} className="py-2 px-1">
              <Skeleton variant="text" width={80} height={16} />
            </div>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <Skeleton variant="text" width={150} height={24} />
              <Skeleton variant="rectangular" width={120} height={40} />
            </div>
            
            {/* Table Skeleton */}
            <SkeletonTable rows={6} columns={4} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Course Form Skeleton
export function CourseFormSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton variant="text" width={100} height={14} className="mb-2" />
        <Skeleton variant="rectangular" height={40} />
      </div>
      
      <div>
        <Skeleton variant="text" width={100} height={14} className="mb-2" />
        <Skeleton variant="rectangular" height={40} />
      </div>

      <div className="flex justify-end space-x-3">
        <Skeleton variant="rectangular" width={80} height={40} />
        <Skeleton variant="rectangular" width={100} height={40} />
      </div>
    </div>
  );
}

// Course Card Skeleton
export function CourseCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('border border-gray-200 rounded-lg p-4', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton variant="text" width="60%" height={20} className="mb-2" />
          <Skeleton variant="text" width="80%" height={16} className="mb-1" />
          <Skeleton variant="text" width="40%" height={14} />
        </div>
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    </div>
  );
}

// Course Offering Management Skeleton
export function CourseOfferingManagementSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width={200} height={28} />
        <Skeleton variant="rectangular" width={150} height={40} />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton variant="text" width={80} height={14} className="mb-2" />
            <Skeleton variant="rectangular" height={40} />
          </div>
        ))}
      </div>

      {/* Offerings Table */}
      <SkeletonTable rows={8} columns={5} />
    </div>
  );
}

// Head TA Recording Modal Skeleton
export function HTARecordingModalSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div>
        <Skeleton variant="text" width={120} height={14} className="mb-2" />
        <Skeleton variant="rectangular" height={40} />
      </div>

      {/* Suggestions Section */}
      <div>
        <Skeleton variant="text" width={150} height={20} className="mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Skeleton variant="text" width="50%" height={18} className="mb-2" />
                  <Skeleton variant="text" width="70%" height={14} className="mb-1" />
                  <Skeleton variant="text" width="40%" height={14} />
                </div>
                <Skeleton variant="rectangular" width={80} height={32} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hours Input */}
      <div>
        <Skeleton variant="text" width={100} height={14} className="mb-2" />
        <Skeleton variant="rectangular" height={40} />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Skeleton variant="rectangular" width={80} height={40} />
        <Skeleton variant="rectangular" width={100} height={40} />
      </div>
    </div>
  );
}

// Course Predictions Skeleton
export function CoursePredictionsSkeleton() {
  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="mb-6">
          <Skeleton variant="text" width={180} height={24} className="mb-4" />
          
          <div className="flex items-center space-x-4">
            <div>
              <Skeleton variant="text" width={40} height={14} className="mb-1" />
              <Skeleton variant="rectangular" width={100} height={40} />
            </div>
            <div>
              <Skeleton variant="text" width={50} height={14} className="mb-1" />
              <Skeleton variant="rectangular" width={100} height={40} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Skeleton variant="text" width="40%" height={18} />
                    <Skeleton variant="rectangular" width={100} height={24} className="ml-2 rounded-full" />
                  </div>
                  <Skeleton variant="text" width="80%" height={14} />
                </div>
                <Skeleton variant="rectangular" width={120} height={32} className="ml-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Bulk Head TA Recording Skeleton
export function BulkHTARecordingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton variant="text" width={200} height={24} className="mb-2" />
        <Skeleton variant="text" width="60%" height={16} />
      </div>

      {/* Semester Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Skeleton variant="text" width={80} height={14} className="mb-2" />
          <Skeleton variant="rectangular" height={40} />
        </div>
        <div>
          <Skeleton variant="text" width={80} height={14} className="mb-2" />
          <Skeleton variant="rectangular" height={40} />
        </div>
      </div>

      {/* Courses List */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton variant="rectangular" width={20} height={20} />
                <div>
                  <Skeleton variant="text" width={150} height={18} className="mb-1" />
                  <Skeleton variant="text" width={100} height={14} />
                </div>
              </div>
              <Skeleton variant="text" width={60} height={16} />
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Skeleton variant="rectangular" width={80} height={40} />
        <Skeleton variant="rectangular" width={150} height={40} />
      </div>
    </div>
  );
}

// Course Timeline Skeleton
export function CourseTimelineSkeleton() {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {[1, 2, 3, 4].map((i, idx) => (
          <li key={i}>
            <div className="relative pb-8">
              {idx < 3 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <Skeleton variant="circular" width={32} height={32} />
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <Skeleton variant="text" width={200} height={16} className="mb-1" />
                    <Skeleton variant="text" width={150} height={14} />
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <Skeleton variant="text" width={80} height={14} />
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Course Offering Form Skeleton
export function CourseOfferingFormSkeleton() {
  return (
    <div className="space-y-4">
      {/* Course Selection */}
      <div>
        <Skeleton variant="text" width={80} height={14} className="mb-2" />
        <Skeleton variant="rectangular" height={40} />
      </div>

      {/* Semester Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Skeleton variant="text" width={60} height={14} className="mb-2" />
          <Skeleton variant="rectangular" height={40} />
        </div>
        <div>
          <Skeleton variant="text" width={40} height={14} className="mb-2" />
          <Skeleton variant="rectangular" height={40} />
        </div>
      </div>

      {/* Professor Selection */}
      <div>
        <Skeleton variant="text" width={80} height={14} className="mb-2" />
        <Skeleton variant="rectangular" height={40} />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Skeleton variant="rectangular" width={80} height={40} />
        <Skeleton variant="rectangular" width={120} height={40} />
      </div>
    </div>
  );
}