import { Metadata } from "next";
import { Suspense } from "react";
import CleanLayout, { CleanPageHeader } from "@/components/layout/CleanLayout";
import Link from "next/link";
import { getPublicDirectory, getDirectoryStats, getPublicUserCount } from "@/lib/public-directory";
import DirectoryFilters from "@/components/directory/DirectoryFilters";
import DirectoryResults from "@/components/directory/DirectoryResults";
import { DirectoryFiltersSkeleton } from "@/components/directory/DirectoryFiltersSkeleton";
import { DirectoryResultsSkeleton } from "@/components/directory/DirectoryResultsSkeleton";
import { DirectoryStats } from "@/components/directory/DirectoryStats";
import { DirectoryStatsSkeleton } from "@/components/directory/DirectoryStatsSkeleton";

export const metadata: Metadata = {
  title: "Public Directory - WU Head TA Directory",
  description: "Browse our directory of Washington University Computer Science Head Teaching Assistants. Find TAs by name, course, graduation year, or location.",
  openGraph: {
    title: "WU Head TA Public Directory",
    description: "Directory of Washington University Computer Science Head Teaching Assistants",
    type: "website",
  },
};

export const dynamic = 'force-dynamic';

interface SearchParams {
  searchParams?: Promise<{
    search?: string;
    gradYear?: string;
    location?: string;
    page?: string;
  }>;
}

// Server component for directory statistics
async function DirectoryStatsSection() {
  const [stats, userCount] = await Promise.all([
    getDirectoryStats(),
    getPublicUserCount()
  ]);
  
  return (
    <DirectoryStats
      totalUsers={userCount}
      totalLocations={stats.locations.length}
      totalGradYears={stats.gradYears.length}
    />
  );
}

// Server component for fetching and displaying filters
async function DirectoryFiltersSection({ searchParams }: { searchParams?: {
  search?: string;
  gradYear?: string;
  location?: string;
  page?: string;
} }) {
  const stats = await getDirectoryStats();
  
  return (
    <DirectoryFilters
      availableFilters={{
        gradYears: stats.gradYears || [],
        locations: stats.locations || [],
      }}
      searchParams={searchParams}
    />
  );
}

// Server component for fetching and displaying results
async function DirectoryResultsSection({ searchParams }: { searchParams?: {
  search?: string;
  gradYear?: string;
  location?: string;
  page?: string;
} }) {
  const directory = await getPublicDirectory({
    search: searchParams?.search,
    gradYear: searchParams?.gradYear ? parseInt(searchParams.gradYear) : undefined,
    location: searchParams?.location,
  });

  return (
    <DirectoryResults
      data={directory}
      searchParams={searchParams}
    />
  );
}

export default async function PublicDirectoryPage({ searchParams }: SearchParams) {
  const resolvedSearchParams = await searchParams;
  
  return (
    <CleanLayout maxWidth="6xl" center>
      <CleanPageHeader
        title="Head TA Directory"
        subtitle="Washington University Computer Science Head Teaching Assistants"
        description="Browse our directory of head teaching assistants. For full access to contact information and additional features, please sign in."
      />

      <div className="space-y-6">
        {/* Stats load independently */}
        <Suspense fallback={<DirectoryStatsSkeleton />}>
          <DirectoryStatsSection />
        </Suspense>

        {/* Filters load independently */}
        <Suspense fallback={<DirectoryFiltersSkeleton />}>
          <DirectoryFiltersSection searchParams={resolvedSearchParams} />
        </Suspense>

        {/* Results load independently */}
        <Suspense fallback={<DirectoryResultsSkeleton />}>
          <DirectoryResultsSection searchParams={resolvedSearchParams} />
        </Suspense>
      </div>

      <div className="mt-16 font-serif text-charcoal space-y-6">
        <p className="text-lg">
          Are you a head TA? Join the directory to connect with fellow TAs.
        </p>
        <nav className="font-serif space-y-4 sm:space-y-0 sm:space-x-12 sm:flex sm:justify-center">
          <Link
            href="/auth/signin"
            className="text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
          >
            Sign In
          </Link>
          <Link
            href="/"
            className="text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
          >
            Back to Home
          </Link>
        </nav>
      </div>
    </CleanLayout>
  );
}