import { SkeletonList } from '@/components/ui/Skeleton';

export default function DirectoryLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-10 bg-gray-200 rounded w-96 mx-auto mb-4 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded w-64 mx-auto animate-pulse" />
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="h-5 bg-gray-200 rounded w-full animate-pulse" />
        </div>

        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Filter skeletons */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>

        <SkeletonList count={8} />
      </div>
    </div>
  );
}