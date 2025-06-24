import { Metadata } from "next";
import Link from "next/link";
import { professorRepository } from "@/lib/repositories/professors";
import { courseOfferingRepository } from "@/lib/repositories/course-offerings";
import { ProfessorCard } from "@/components/professor/ProfessorCard";

export const metadata: Metadata = {
  title: "Professors - WU Head TA Directory",
  description: "Browse professors who work with head TAs",
};

interface SearchParams {
  searchParams?: {
    search?: string;
  };
}

export default async function ProfessorsPage({ searchParams }: SearchParams) {
  // Get professors based on search
  let professors;
  if (searchParams?.search) {
    professors = await professorRepository.search(searchParams.search);
  } else {
    professors = await professorRepository.findAll();
  }

  // Get statistics for each professor
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentSeason = currentMonth >= 8 ? "Fall" : "Spring";

  const professorsWithStats = await Promise.all(
    professors.map(async (professor) => {
      const offerings = await courseOfferingRepository.findWithRelationsByProfessorId(professor.id);
      const uniqueCourses = new Set(offerings.map(o => o.courseId));
      
      // Get current courses
      const currentOfferings = offerings.filter(o => 
        o.year === currentYear && o.season === currentSeason
      );
      
      const recentOfferings = offerings.slice(0, 3);

      return {
        ...professor,
        courseCount: uniqueCourses.size,
        offeringCount: offerings.length,
        currentOfferings,
        recentOfferings,
      };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Professor Directory
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Professors who work with head TAs
          </p>
        </div>

        {/* Search */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <form method="get">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search professors
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="search"
                  id="search"
                  defaultValue={searchParams?.search}
                  className="flex-1 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Search by name or email..."
                />
                <button
                  type="submit"
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Search
                </button>
                {searchParams?.search && (
                  <Link
                    href="/professors"
                    className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Clear
                  </Link>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {professorsWithStats.map((professor) => (
            <ProfessorCard
              key={professor.id}
              professor={professor}
              currentCourses={professor.currentOfferings}
              courseCount={professor.courseCount}
              offeringCount={professor.offeringCount}
            />
          ))}
        </div>

        {professorsWithStats.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">
              {searchParams?.search
                ? "No professors found matching your search."
                : "No professors found."}
            </p>
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