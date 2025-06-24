import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { courseOfferings, taAssignments } from "@/lib/db/schema";
import { desc, sql, eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Semesters - WU Head TA Directory",
  description: "Browse head TAs by semester",
};

interface SemesterInfo {
  semester: string;
  year: number;
  season: string;
  courseCount: number;
  taCount: number;
}

interface PageProps {
  searchParams?: {
    year?: string;
  };
}

async function getSemesters(yearFilter?: number): Promise<SemesterInfo[]> {
  // Get unique semesters with counts
  let query = db
    .select({
      semester: courseOfferings.semester,
      year: courseOfferings.year,
      season: courseOfferings.season,
      courseCount: sql<number>`count(distinct ${courseOfferings.courseId})`,
      taCount: sql<number>`count(distinct ${taAssignments.userId})`,
    })
    .from(courseOfferings)
    .leftJoin(
      taAssignments,
      eq(taAssignments.courseOfferingId, courseOfferings.id)
    )
    .groupBy(courseOfferings.semester, courseOfferings.year, courseOfferings.season)
    .orderBy(desc(courseOfferings.year), desc(courseOfferings.season));

  if (yearFilter) {
    query = query.where(eq(courseOfferings.year, yearFilter));
  }

  return await query;
}

async function getDistinctYears(): Promise<number[]> {
  const years = await db
    .selectDistinct({
      year: courseOfferings.year,
    })
    .from(courseOfferings)
    .orderBy(desc(courseOfferings.year));

  return years.map(y => y.year);
}

export default async function SemestersPage({ searchParams }: PageProps) {
  const yearFilter = searchParams?.year ? parseInt(searchParams.year) : undefined;
  const semesters = await getSemesters(yearFilter);
  const availableYears = await getDistinctYears();

  // Group by academic year
  const semestersByYear = semesters.reduce((acc, semester) => {
    const academicYear = semester.season === "Fall" 
      ? `${semester.year}-${semester.year + 1}`
      : `${semester.year - 1}-${semester.year}`;
    
    if (!acc[academicYear]) {
      acc[academicYear] = [];
    }
    acc[academicYear].push(semester);
    return acc;
  }, {} as Record<string, SemesterInfo[]>);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Browse by Semester
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Explore head TAs and courses by semester
          </p>
        </div>

        {/* Year Filter */}
        <div className="mb-6">
          <form method="get" className="flex items-center justify-center gap-4">
            <label htmlFor="year" className="text-sm font-medium text-gray-700">
              Filter by year:
            </label>
            <select
              name="year"
              id="year"
              value={yearFilter || ''}
              onChange={(e) => {
                const params = new URLSearchParams();
                if (e.target.value) params.set('year', e.target.value);
                window.location.href = `/semesters${params.toString() ? `?${params.toString()}` : ''}`;
              }}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {yearFilter && (
              <Link
                href="/semesters"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Clear filter
              </Link>
            )}
          </form>
        </div>

        {/* Semester Cards Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {semesters.map((semester) => (
            <Link
              key={semester.semester}
              href={`/semesters/${semester.semester}`}
              className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                  {semester.season} {semester.year}
                </h3>
                <svg
                  className="h-5 w-5 text-gray-400 group-hover:text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Courses</span>
                  <span className="text-2xl font-bold text-gray-900">{semester.courseCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Head TAs</span>
                  <span className="text-2xl font-bold text-gray-900">{semester.taCount}</span>
                </div>
              </div>

              {semester.taCount < semester.courseCount && (
                <div className="mt-4 flex items-center text-sm text-yellow-600">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Some courses need TAs
                </div>
              )}
            </Link>
          ))}
        </div>

        {semesters.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">No semesters found{yearFilter ? ` for year ${yearFilter}` : ''}.</p>
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