import { Metadata } from "next";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CleanLayout, { CleanPageHeader } from "@/components/layout/CleanLayout";
import { MissingTAsStatsServer } from "@/components/dashboard/MissingTAsStatsServer";
import { MissingTAsBySemesterServer } from "@/components/dashboard/MissingTAsBySemesterServer";
import { MissingTAWidget } from "@/components/dashboard/MissingTAWidget";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Courses Without Recorded Head TAs - WU Head TA Directory",
  description: "View all courses lacking Head TA documentation",
};

// Skeleton for stats
function MissingTAsStatsSkeleton() {
  return (
    <div className="text-center mb-16">
      <Skeleton variant="text" width="80px" height="60px" className="mx-auto mb-2" />
      <Skeleton variant="text" width="200px" height="16px" className="mx-auto" />
    </div>
  );
}

// Skeleton for semester sections
function MissingTAsBySemesterSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {[1, 2].map((col) => (
        <div key={col} className="border-t border-charcoal pt-6">
          <Skeleton variant="text" width="200px" height="24px" className="mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start justify-between pb-4 border-b border-charcoal/10 last:border-0">
                <div className="flex-1">
                  <Skeleton variant="text" width="250px" height="20px" className="mb-1" />
                  <Skeleton variant="text" width="200px" height="16px" />
                </div>
                <div className="ml-4 flex flex-col space-y-1">
                  <Skeleton variant="text" width="60px" height="16px" />
                  <Skeleton variant="text" width="60px" height="16px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Full list skeleton
function MissingTAsFullListSkeleton() {
  return (
    <div className="bg-white">
      <div className="space-y-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-t border-charcoal/20 pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Skeleton variant="text" width="300px" height="24px" className="mb-2" />
                <Skeleton variant="text" width="350px" height="16px" className="mb-1" />
                <Skeleton variant="text" width="150px" height="16px" />
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

export default async function MissingTAsDashboard() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user;
  const isAdmin = session?.user?.role === 'admin';

  return (
    <CleanLayout maxWidth="7xl">
      <CleanPageHeader
        title="Courses Without Recorded Head TAs"
        subtitle="View courses lacking Head TA documentation"
        description="Help complete our historical records"
      />

      {/* Statistics */}
      <Suspense fallback={<MissingTAsStatsSkeleton />}>
        <MissingTAsStatsServer />
      </Suspense>

      {/* Sign in prompt for unauthenticated users */}
      {!isAuthenticated && (
        <section className="mb-16">
          <div className="border-t border-charcoal pt-8 text-center">
            <p className="font-serif text-lg text-charcoal mb-4">
              Know who taught these courses?
            </p>
            <Link 
              href="/auth/signin" 
              className="inline-block font-serif text-sm uppercase tracking-wider text-charcoal border border-charcoal px-6 py-3 hover:bg-charcoal hover:text-white transition-colors duration-200"
            >
              Sign in to record Head TAs
            </Link>
          </div>
        </section>
      )}

      {/* Missing Head TAs by Semester */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl text-charcoal mb-8">By Semester</h2>
        <Suspense fallback={<MissingTAsBySemesterSkeleton />}>
          <MissingTAsBySemesterServer isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
        </Suspense>
      </section>

      {/* Full List Widget */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl text-charcoal mb-8">All Courses Without Recorded Head TAs</h2>
        <Suspense fallback={<MissingTAsFullListSkeleton />}>
          <MissingTAsFullListServer />
        </Suspense>
      </section>

      <div className="text-center">
        <Link
          href="/dashboard"
          className="font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
        >
          ← Back to dashboard
        </Link>
      </div>
    </CleanLayout>
  );
}

// Server component for full list
async function MissingTAsFullListServer() {
  const { courseOfferingRepository } = await import("@/lib/repositories/course-offerings");
  const allOfferings = await courseOfferingRepository.findAllWithRelations();
  const missingTAOfferings = allOfferings.filter(
    offering => !offering.taAssignments || offering.taAssignments.length === 0
  );
  
  // Pass authentication props to the widget
  const widgetProps = { initialOfferings: missingTAOfferings, showAll: true };
  
  // The MissingTAWidget will use useAuth() hook internally to get auth state
  // We just need to ensure it has the initial data
  return <MissingTAWidget {...widgetProps} />;
}