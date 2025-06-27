import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import CleanLayout, { CleanPageHeader } from "@/components/layout/CleanLayout";
import { EnhancedDashboardStats } from "@/components/dashboard/EnhancedDashboardStats";
import { EnhancedMissingTAWidget } from "@/components/dashboard/EnhancedMissingTAWidget";
import { EnhancedTAWorkloadWidget } from "@/components/dashboard/EnhancedTAWorkloadWidget";
import { EnhancedQuickActions } from "@/components/dashboard/EnhancedQuickActions";
import { EnhancedDashboardNavigation } from "@/components/dashboard/EnhancedDashboardNavigation";
import { TAWorkloadSkeleton } from "@/components/dashboard/TAWorkloadSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Dashboard - WU Head TA Directory",
  description: "View current statistics and courses without recorded HTAs",
};

// Skeleton for the stats section
function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="text-center">
          <Skeleton variant="text" width="60px" height="48px" className="mx-auto mb-2" />
          <Skeleton variant="text" width="120px" height="16px" className="mx-auto mb-1" />
          <Skeleton variant="text" width="100px" height="14px" className="mx-auto" />
        </div>
      ))}
    </div>
  );
}

// Skeleton for Missing TAs Widget
function MissingTASkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Skeleton variant="text" width="300px" height="24px" />
        <Skeleton variant="text" width="80px" height="16px" />
      </div>
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-t border-charcoal/20 pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Skeleton variant="text" width="250px" height="24px" className="mb-2" />
                <Skeleton variant="text" width="300px" height="16px" className="mb-1" />
                <Skeleton variant="text" width="120px" height="16px" />
              </div>
              <div className="ml-6 flex flex-col space-y-2">
                <Skeleton variant="text" width="100px" height="16px" />
                <Skeleton variant="text" width="100px" height="16px" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for Quick Actions
function QuickActionsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="border-t border-charcoal pt-4">
          <Skeleton variant="text" width="150px" height="24px" className="mb-2" />
          <Skeleton variant="text" width="200px" height="16px" />
        </div>
      ))}
    </div>
  );
}


export default async function DashboardPage() {
  // Get session to check if user is authenticated
  const session = await getServerSession(authOptions);
  
  // Redirect to home page if not authenticated
  if (!session?.user) {
    redirect('/');
  }
  
  const isAdmin = session.user.role === 'admin';

  return (
    <CleanLayout maxWidth="7xl">
      <CleanPageHeader
        title="TA Dashboard"
        subtitle={session?.user ? `Welcome back, ${session.user.firstName}` : 'WU Computer Science'}
        description="Current statistics and courses without recorded HTAs"
      />

      {/* Quick Actions - Only for authenticated admins */}
      {isAdmin && (
        <section className="mb-16">
          <h2 className="font-serif text-2xl text-charcoal mb-8">Quick Actions</h2>
          <Suspense fallback={<QuickActionsSkeleton />}>
            <EnhancedQuickActions />
          </Suspense>
        </section>
      )}

      {/* Sign in prompt for unauthenticated users */}
      {!session.user && (
        <section className="mb-16">
          <div className="border-t border-charcoal pt-8">
            <p className="font-serif text-lg text-charcoal mb-4">
              Want to manage courses and TAs?
            </p>
            <a 
              href="/auth/signin" 
              className="inline-block font-serif text-sm uppercase tracking-wider text-charcoal border border-charcoal px-6 py-3 hover:bg-charcoal hover:text-white transition-colors duration-200"
            >
              Sign in to manage
            </a>
          </div>
        </section>
      )}

      {/* Statistics Overview - Available to all users */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl text-charcoal mb-8">Current Statistics</h2>
        <Suspense fallback={<StatsCardsSkeleton />}>
          <EnhancedDashboardStats />
        </Suspense>
      </section>

      {/* Missing TAs Widget - Available to all users */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-2xl text-charcoal">Courses Without Recorded HTAs</h2>
          {!session.user && (
            <p className="font-serif text-sm italic text-charcoal/60">
              Sign in to record HTAs
            </p>
          )}
        </div>
        <Suspense fallback={<MissingTASkeleton />}>
          <EnhancedMissingTAWidget isAuthenticated={!!session.user} isAdmin={isAdmin} />
        </Suspense>
      </section>

      {/* TA Workload Widget - Only for authenticated users */}
      {session.user && (
        <section className="mb-16">
          <h2 className="font-serif text-2xl text-charcoal mb-8">TA Workload</h2>
          <Suspense fallback={<TAWorkloadSkeleton />}>
            <EnhancedTAWorkloadWidget />
          </Suspense>
        </section>
      )}

      {/* Navigation Links - Available to all users */}
      <EnhancedDashboardNavigation />
    </CleanLayout>
  );
}