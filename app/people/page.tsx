import { Metadata } from "next";
import Link from "next/link";
import { userRepository } from "@/lib/repositories/users";
import CleanLayout, { CleanPageHeader } from "@/components/layout/CleanLayout";
import { ProgressivePeopleFilters } from "@/components/people/ProgressivePeopleFilters";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "People - WU Head TA Directory",
  description: "Browse all head TAs in the directory",
};

interface FilterProps {
  searchParams?: Promise<{
    gradYear?: string;
    location?: string;
    search?: string;
    page?: string;
    pageSize?: string;
  }>;
}

export default async function PeoplePage({ searchParams }: FilterProps) {
  const resolvedSearchParams = await searchParams;
  // Parse filters
  const filters = {
    gradYear: resolvedSearchParams?.gradYear ? parseInt(resolvedSearchParams.gradYear) : undefined,
    location: resolvedSearchParams?.location,
  };

  // Parse pagination
  const page = parseInt(resolvedSearchParams?.page || '1');
  const pageSize = parseInt(resolvedSearchParams?.pageSize || '12');
  const offset = (page - 1) * pageSize;

  // Get users based on filters or search
  let users;
  let totalCount;
  
  if (resolvedSearchParams?.search) {
    const searchResults = await userRepository.search(resolvedSearchParams.search);
    totalCount = searchResults.length;
    users = searchResults.slice(offset, offset + pageSize);
  } else {
    const allUsers = await userRepository.findAll(filters);
    totalCount = allUsers.length;
    users = allUsers.slice(offset, offset + pageSize);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  // Get distinct values for filters
  const locations = await userRepository.getDistinctLocations();
  const gradYears = await userRepository.getDistinctGradYears();

  return (
    <CleanLayout maxWidth="6xl" center>
      <CleanPageHeader
        title="Head TA Directory"
        subtitle="Connect with current and former head TAs"
        description="Browse our complete directory of Washington University Computer Science head teaching assistants."
      />

      {/* Search and Filters */}
      <ProgressivePeopleFilters
        availableFilters={{
          gradYears: gradYears,
          locations: locations,
        }}
        searchParams={resolvedSearchParams}
      />

      {/* Results Count */}
      <div className="mb-8">
        <p className="font-serif text-charcoal">
          Showing <span className="font-medium">{users.length}</span> of{' '}
          <span className="font-medium">{totalCount}</span> results
        </p>
      </div>

      {/* Results List */}
      <div className="space-y-8">
        {users.map((user) => (
          <div key={user.id} className="border-b border-charcoal/10 pb-8 last:border-0">
            <h3 className="font-serif text-2xl text-charcoal mb-2">
              {user.firstName} {user.lastName}
            </h3>
            <div className="font-serif text-charcoal/70 space-y-1">
              {user.email && (
                <p>{user.email}</p>
              )}
              {user.degreeProgram && (
                <p>{user.degreeProgram}</p>
              )}
              {user.gradYear && (
                <p>Class of {user.gradYear}</p>
              )}
              {user.currentRole && (
                <p>
                  {user.currentRole}
                </p>
              )}
              {user.location && (
                <p>{user.location}</p>
              )}
            </div>
            <Link 
              href={`/profile/${user.id}`}
              className="inline-block mt-4 font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity"
            >
              View Profile
            </Link>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-16">
          <p className="font-serif text-2xl text-charcoal mb-4">No people found</p>
          <p className="font-serif text-charcoal/70">No people found matching your criteria.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 pt-8 border-t border-charcoal/10">
          <nav className="flex items-center justify-between" aria-label="Pagination">
            <div className="flex gap-6">
              <Link
                href={`/people?${new URLSearchParams({
                  ...Object.fromEntries(Object.entries(resolvedSearchParams || {}).filter(([k]) => k !== 'page')),
                  page: String(Math.max(1, page - 1))
                }).toString()}`}
                className={`font-serif text-sm uppercase tracking-wider ${
                  page === 1
                    ? 'text-charcoal/30 cursor-not-allowed'
                    : 'text-charcoal hover:opacity-70 transition-opacity'
                }`}
              >
                Previous
              </Link>
            </div>
            
            <div className="font-serif text-charcoal">
              Page {page} of {totalPages}
            </div>
            
            <div className="flex gap-6">
              <Link
                href={`/people?${new URLSearchParams({
                  ...Object.fromEntries(Object.entries(resolvedSearchParams || {}).filter(([k]) => k !== 'page')),
                  page: String(Math.min(totalPages, page + 1))
                }).toString()}`}
                className={`font-serif text-sm uppercase tracking-wider ${
                  page === totalPages
                    ? 'text-charcoal/30 cursor-not-allowed'
                    : 'text-charcoal hover:opacity-70 transition-opacity'
                }`}
              >
                Next
              </Link>
            </div>
          </nav>
        </div>
      )}

      <div className="mt-16 font-serif text-charcoal">
        <nav className="font-serif space-y-4 sm:space-y-0 sm:space-x-12 sm:flex sm:justify-center">
          <Link
            href="/"
            className="text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
          >
            Back to Home
          </Link>
          <Link
            href="/directory"
            className="text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
          >
            Public Directory
          </Link>
        </nav>
      </div>
    </CleanLayout>
  );
}