import { Skeleton } from "@/components/ui/Skeleton";

export default function ProfileLoading() {
  // This page just redirects to /profile/[userId], so we show a minimal loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Skeleton variant="circular" width={60} height={60} className="mx-auto mb-4" />
        <Skeleton variant="text" width={200} height={20} className="mx-auto" />
      </div>
    </div>
  );
}