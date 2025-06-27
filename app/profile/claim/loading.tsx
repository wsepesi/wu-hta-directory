import CleanLayout, { CleanPageHeader } from '@/components/layout/CleanLayout';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ClaimProfileLoading() {
  return (
    <CleanLayout maxWidth="4xl">
      <CleanPageHeader
        title="Claim Your Profile"
        subtitle="Found unclaimed profiles that may belong to you"
        description="Review the profiles below and claim any that belong to you. This will merge all associated course assignments with your current profile."
      />

      <div className="grid gap-6">
        {/* Profile cards skeleton */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-charcoal-100 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Skeleton variant="text" width={200} height={24} className="mb-2" />
                
                <div className="mt-2 space-y-1">
                  <Skeleton variant="text" width={120} height={16} />
                  <Skeleton variant="text" width={150} height={16} />
                  <Skeleton variant="text" width={100} height={16} />
                </div>

                <div className="mt-4">
                  <Skeleton variant="text" width={160} height={16} className="mb-2" />
                  <div className="space-y-1">
                    <Skeleton variant="text" width="80%" height={14} />
                    <Skeleton variant="text" width="75%" height={14} />
                    <Skeleton variant="text" width="70%" height={14} />
                  </div>
                </div>
              </div>

              <Skeleton variant="rectangular" width={100} height={36} className="ml-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Skeleton variant="text" width={150} height={16} className="mx-auto" />
      </div>
    </CleanLayout>
  );
}