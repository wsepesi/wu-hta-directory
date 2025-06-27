import { CourseManagementSkeleton } from '@/components/course/CourseSkeletons';

export default function ManageCoursesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="h-9 w-64 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
        </div>

        <CourseManagementSkeleton />

        <div className="mt-8 text-center">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mx-auto" />
        </div>
      </div>
    </div>
  );
}