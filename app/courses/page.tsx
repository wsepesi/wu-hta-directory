import { Metadata } from "next";
import Link from "next/link";
import { courseRepository } from "@/lib/repositories/courses";
import { courseOfferingRepository } from "@/lib/repositories/course-offerings";
import { taAssignmentRepository } from "@/lib/repositories/ta-assignments";
import { CourseCard } from "@/components/course/CourseCard";

export const metadata: Metadata = {
  title: "Courses - WU Head TA Directory",
  description: "Browse all courses with head TAs",
};

interface FilterProps {
  searchParams?: {
    pattern?: string;
    search?: string;
  };
}

export default async function CoursesPage({ searchParams }: FilterProps) {
  // Parse filters
  const filters = searchParams?.pattern
    ? { offeringPattern: searchParams.pattern as any }
    : undefined;

  // Get courses based on filters or search
  let courses;
  if (searchParams?.search) {
    courses = await courseRepository.search(searchParams.search);
  } else {
    courses = await courseRepository.findAll(filters);
  }

  // Get course statistics including current TA status
  const courseStats = await Promise.all(
    courses.map(async (course) => {
      const offerings = await courseOfferingRepository.findByCourseId(course.id);
      const uniqueProfessors = new Set(offerings.map(o => o.professorId).filter(Boolean));
      
      // Get current semester offering
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const currentSeason = currentMonth >= 8 ? "Fall" : "Spring";
      const currentOffering = offerings.find(o => 
        o.year === currentYear && o.season === currentSeason
      );
      
      let currentTAs = 0;
      if (currentOffering) {
        const assignments = await taAssignmentRepository.findByCourseOfferingId(currentOffering.id);
        currentTAs = assignments.length;
      }
      
      return {
        ...course,
        offeringCount: offerings.length,
        professorCount: uniqueProfessors.size,
        lastOffered: offerings[0]
          ? `${offerings[0].season} ${offerings[0].year}`
          : "Never",
        currentOffering,
        currentTAs,
        needsTA: currentOffering && currentTAs === 0,
      };
    })
  );

  const patternOptions = [
    { value: "both", label: "Fall & Spring" },
    { value: "fall_only", label: "Fall Only" },
    { value: "spring_only", label: "Spring Only" },
    { value: "sparse", label: "Occasionally Offered" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Course Directory
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Explore all courses with head TA support
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <form method="get" className="space-y-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search by course number or name
              </label>
              <input
                type="text"
                name="search"
                id="search"
                defaultValue={searchParams?.search}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g., CSE 131 or Data Structures"
              />
            </div>

            <div>
              <label htmlFor="pattern" className="block text-sm font-medium text-gray-700">
                Offering Pattern
              </label>
              <select
                name="pattern"
                id="pattern"
                defaultValue={searchParams?.pattern}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All patterns</option>
                {patternOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href="/courses"
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

        {/* Results Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courseStats.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              currentOffering={course.currentOffering}
              taCount={course.currentTAs}
              showStats
            />
          ))}
        </div>

        {courseStats.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">No courses found matching your criteria.</p>
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