import { Metadata } from "next";
import PublicDirectoryClient from "./PublicDirectoryClient";

export const metadata: Metadata = {
  title: "Public Directory - WU Head TA Directory",
  description: "Browse our directory of Washington University Computer Science Head Teaching Assistants. Find TAs by name, course, graduation year, or location.",
  openGraph: {
    title: "WU Head TA Public Directory",
    description: "Directory of Washington University Computer Science Head Teaching Assistants",
    type: "website",
  },
};

interface SearchParams {
  searchParams?: {
    search?: string;
    gradYear?: string;
    location?: string;
    page?: string;
  };
}

export default async function PublicDirectoryPage({ searchParams }: SearchParams) {
  // Fetch initial data from API
  const params = new URLSearchParams();
  if (searchParams?.search) params.append("search", searchParams.search);
  if (searchParams?.gradYear) params.append("gradYear", searchParams.gradYear);
  if (searchParams?.location) params.append("location", searchParams.location);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/directory?${params}`,
    { cache: "no-store" }
  );

  const data = await response.json();
  const directory = data.data || [];

  // Get stats for filters
  const statsResponse = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/directory/stats`,
    { cache: "no-store" }
  );
  
  const statsData = await statsResponse.json();
  const stats = statsData.data || { locations: [], gradYears: [] };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Head TA Public Directory
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Washington University Computer Science Head Teaching Assistants
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="text-sm text-gray-600">
            <p>
              This is a public directory of head teaching assistants in the Washington University
              Computer Science department. For full access to contact information and additional
              features, please sign in.
            </p>
          </div>
        </div>

        <PublicDirectoryClient
          initialData={directory}
          availableFilters={{
            gradYears: stats.gradYears || [],
            locations: stats.locations || [],
          }}
          searchParams={searchParams}
        />

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Are you a head TA? Join the directory to connect with fellow TAs.
          </p>
          <a
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}