import { Metadata } from "next";
import Link from "next/link";
import { userRepository } from "@/lib/repositories/users";
import { TACard } from "@/components/ta/TACard";

export const metadata: Metadata = {
  title: "People - WU Head TA Directory",
  description: "Browse all head TAs in the directory",
};

interface FilterProps {
  searchParams?: {
    gradYear?: string;
    location?: string;
    search?: string;
    page?: string;
    pageSize?: string;
  };
}

export default async function PeoplePage({ searchParams }: FilterProps) {
  // Parse filters
  const filters = {
    gradYear: searchParams?.gradYear ? parseInt(searchParams.gradYear) : undefined,
    location: searchParams?.location,
  };

  // Parse pagination
  const page = parseInt(searchParams?.page || '1');
  const pageSize = parseInt(searchParams?.pageSize || '12');
  const offset = (page - 1) * pageSize;

  // Get users based on filters or search
  let users;
  let totalCount;
  
  if (searchParams?.search) {
    const searchResults = await userRepository.search(searchParams.search);
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Head TA Directory
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Connect with current and former head TAs
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <form method="get" className="space-y-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search by name or email
              </label>
              <input
                type="text"
                name="search"
                id="search"
                defaultValue={searchParams?.search}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Search..."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="gradYear" className="block text-sm font-medium text-gray-700">
                  Graduation Year
                </label>
                <select
                  name="gradYear"
                  id="gradYear"
                  defaultValue={searchParams?.gradYear}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All years</option>
                  {gradYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <select
                  name="location"
                  id="location"
                  defaultValue={searchParams?.location}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All locations</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href="/people"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear filters
              </Link>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Apply filters
              </button>
            </div>
          </form>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{users.length}</span> of{' '}
            <span className="font-medium">{totalCount}</span> results
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <TACard key={user.id} user={user} />
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">No people found matching your criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 bg-white rounded-lg shadow-sm px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <Link
                href={`/people?${new URLSearchParams({
                  ...Object.fromEntries(Object.entries(searchParams || {}).filter(([k]) => k !== 'page')),
                  page: String(Math.max(1, page - 1))
                }).toString()}`}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </Link>
              <Link
                href={`/people?${new URLSearchParams({
                  ...Object.fromEntries(Object.entries(searchParams || {}).filter(([k]) => k !== 'page')),
                  page: String(Math.min(totalPages, page + 1))
                }).toString()}`}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  page === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </Link>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> of{' '}
                  <span className="font-medium">{totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  {/* Previous Page */}
                  <Link
                    href={`/people?${new URLSearchParams({
                      ...Object.fromEntries(Object.entries(searchParams || {}).filter(([k]) => k !== 'page')),
                      page: String(Math.max(1, page - 1))
                    }).toString()}`}
                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                      page === 1 ? 'cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </Link>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <Link
                        key={pageNumber}
                        href={`/people?${new URLSearchParams({
                          ...Object.fromEntries(Object.entries(searchParams || {}).filter(([k]) => k !== 'page')),
                          page: String(pageNumber)
                        }).toString()}`}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          page === pageNumber
                            ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </Link>
                    );
                  })}

                  {/* Next Page */}
                  <Link
                    href={`/people?${new URLSearchParams({
                      ...Object.fromEntries(Object.entries(searchParams || {}).filter(([k]) => k !== 'page')),
                      page: String(Math.min(totalPages, page + 1))
                    }).toString()}`}
                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                      page === totalPages ? 'cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}