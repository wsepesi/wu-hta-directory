import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { courseOfferings, taAssignments } from "@/lib/db/schema";
import { desc, sql, eq } from "drizzle-orm";
import CleanLayout, { CleanPageHeader } from "@/components/layout/CleanLayout";
import { ProgressiveSemesterFilters } from "@/components/semester/ProgressiveSemesterFilters";

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
  searchParams?: Promise<{
    year?: string;
  }>;
}

async function getSemesters(yearFilter?: number): Promise<SemesterInfo[]> {
  // Get unique semesters with counts
  const baseQuery = db
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
    .groupBy(courseOfferings.semester, courseOfferings.year, courseOfferings.season);

  if (yearFilter) {
    return await baseQuery
      .where(eq(courseOfferings.year, yearFilter))
      .orderBy(desc(courseOfferings.year), desc(courseOfferings.season));
  }

  return await baseQuery
    .orderBy(desc(courseOfferings.year), desc(courseOfferings.season));
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
  const resolvedSearchParams = await searchParams;
  const yearFilter = resolvedSearchParams?.year ? parseInt(resolvedSearchParams.year) : undefined;
  const semesters = await getSemesters(yearFilter);
  const availableYears = await getDistinctYears();

  return (
    <CleanLayout maxWidth="6xl">
      <CleanPageHeader
        title="Browse by Semester"
        subtitle="Explore head TAs and courses across academic terms"
      />

      {/* Year Filter */}
      <ProgressiveSemesterFilters
        availableYears={availableYears}
        yearFilter={yearFilter}
      />

      {/* Minimal Timeline */}
      <div className="space-y-0">
        {semesters.map((semester) => (
          <Link
            key={semester.semester}
            href={`/semesters/${semester.semester}`}
            className="group block border-b border-charcoal/10 py-8 hover:opacity-70 transition-opacity duration-200"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-8">
              {/* Timeline marker and date */}
              <div className="sm:col-span-3 sm:text-right">
                <div className="font-serif">
                  <span className="text-xl sm:text-2xl">{semester.season}</span>
                  <span className="text-xl sm:text-2xl ml-2 text-charcoal/60">{semester.year}</span>
                </div>
              </div>
              
              {/* Vertical line and dot - hidden on mobile */}
              <div className="hidden sm:block sm:col-span-1 relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-charcoal/10"></div>
                <div className="absolute left-1/2 top-8 w-2 h-2 -ml-1 bg-charcoal rounded-full"></div>
              </div>
              
              {/* Content */}
              <div className="sm:col-span-8">
                <div className="font-serif space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-4 sm:gap-8">
                    <div>
                      <span className="text-2xl sm:text-3xl">{semester.courseCount}</span>
                      <span className="text-xs sm:text-sm uppercase tracking-wider text-charcoal/60 ml-2">Courses</span>
                    </div>
                    <div>
                      <span className="text-2xl sm:text-3xl">{semester.taCount}</span>
                      <span className="text-xs sm:text-sm uppercase tracking-wider text-charcoal/60 ml-2">Head TAs</span>
                    </div>
                  </div>
                  
                  {semester.taCount < semester.courseCount && (
                    <p className="text-xs sm:text-sm italic text-charcoal/60">
                      {semester.courseCount - semester.taCount} courses need teaching assistants
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {semesters.length === 0 && (
        <div className="text-center py-24 border-t border-charcoal/10">
          <p className="font-serif text-charcoal/60 italic">
            No semesters found{yearFilter ? ` for year ${yearFilter}` : ''}.
          </p>
        </div>
      )}

      <div className="mt-24 pt-8 border-t border-charcoal/10 text-center">
        <Link
          href="/"
          className="font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
        >
          Return Home
        </Link>
      </div>
    </CleanLayout>
  );
}