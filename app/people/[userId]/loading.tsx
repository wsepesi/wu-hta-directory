import { Skeleton } from "@/components/ui/Skeleton";

export default function UserProfileLoading() {
  // This page just redirects to /profile/[userId], so we show a minimal loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Skeleton variant="circular" width={80} height={80} className="mx-auto mb-4" />
        <Skeleton variant="text" width={250} height={24} className="mx-auto mb-2" />
        <Skeleton variant="text" width={300} height={16} className="mx-auto" />
      </div>
    </div>
  );
}