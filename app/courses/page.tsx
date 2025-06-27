import { Metadata } from "next";
import { Suspense } from "react";
import CleanLayout, { CleanPageHeader } from "@/components/layout/CleanLayout";
import Link from "next/link";
import { ProgressiveCourseFilters } from "@/components/course/ProgressiveCourseFilters";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Courses - WU Head TA Directory",
  description: "Browse all courses with head TAs",
};

interface FilterProps {
  searchParams?: Promise<{
    pattern?: string;
    search?: string;
  }>;
}

// Server component for search filters
async function CourseSearchFilters({ searchParams }: FilterProps) {
  const resolvedSearchParams = await searchParams;
  
  return (
    <ProgressiveCourseFilters searchParams={resolvedSearchParams} />
  );
}

// Search filters skeleton
function SearchFiltersSkeleton() {
  return (
    <div className="mb-12">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="h-4 w-20 bg-charcoal/10 rounded mb-2 animate-pulse" />
            <div className="h-10 w-full bg-charcoal/5 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <div className="h-8 w-16 bg-charcoal/10 rounded animate-pulse" />
          <div className="h-10 w-24 bg-charcoal/10 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// Server component for course list
async function CourseList({ searchParams }: FilterProps) {
  const { courseRepository } = await import("@/lib/repositories/courses");
  const { courseOfferingRepository } = await import("@/lib/repositories/course-offerings");
  const { taAssignmentRepository } = await import("@/lib/repositories/hta-records");
  const { isSemesterCurrent, isSemesterFuture, parseSemester } = await import("@/lib/semester-utils");
  const { UnclaimedTAMarker } = await import("@/components/ta/UnclaimedTAMarker");
  
  const resolvedSearchParams = await searchParams;
  
  // Parallel data fetching
  const [courses, currentYear, currentMonth] = await Promise.all([
    resolvedSearchParams?.search 
      ? courseRepository.search(resolvedSearchParams.search)
      : courseRepository.findAll(),
    Promise.resolve(new Date().getFullYear()),
    Promise.resolve(new Date().getMonth())
  ]);

  const currentSeason = currentMonth >= 8 ? "Fall" : "Spring";
  const courseIds = courses.map(c => c.id);
  
  // Parallel fetch offerings and build current offering IDs
  const allOfferings = await courseOfferingRepository.findByCourseIds(courseIds);
  
  const currentOfferingIds = allOfferings
    .filter(o => o.year === currentYear && o.season === currentSeason)
    .map(o => o.id);
  
  // Fetch assignments only if we have current offerings
  const allAssignments = currentOfferingIds.length > 0 
    ? await taAssignmentRepository.findByCourseOfferingIds(currentOfferingIds)
    : [];

  // Group data by course
  const offeringsByCourse = new Map<string, typeof allOfferings>();
  const assignmentsByOffering = new Map<string, typeof allAssignments>();
  
  for (const offering of allOfferings) {
    if (!offeringsByCourse.has(offering.courseId)) {
      offeringsByCourse.set(offering.courseId, []);
    }
    offeringsByCourse.get(offering.courseId)!.push(offering);
  }
  
  for (const assignment of allAssignments) {
    if (!assignmentsByOffering.has(assignment.courseOfferingId)) {
      assignmentsByOffering.set(assignment.courseOfferingId, []);
    }
    assignmentsByOffering.get(assignment.courseOfferingId)!.push(assignment);
  }

  // Helper function to check if a semester is active
  function isActiveSemester(season: string, year: number): boolean {
    try {
      const semester = parseSemester(`${season} ${year}`);
      return isSemesterCurrent(semester) || isSemesterFuture(semester);
    } catch {
      return false;
    }
  }

  // Build course statistics
  const courseStats = courses.map((course) => {
    const offerings = offeringsByCourse.get(course.id) || [];
    const uniqueProfessors = new Set(offerings.map(o => o.professorId).filter(Boolean));
    
    const currentOffering = offerings.find(o => 
      o.year === currentYear && o.season === currentSeason
    );
    
    const currentTAs = currentOffering 
      ? (assignmentsByOffering.get(currentOffering.id) || []).length
      : 0;
    
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
  });

  if (courseStats.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-serif text-charcoal/70">No courses found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {courseStats.map((course) => (
        <Link
          key={course.id}
          href={`/courses/${course.courseNumber}`}
          className="block group"
        >
          <div className="border-b border-charcoal/10 pb-6 hover:opacity-70 transition-opacity duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="font-serif text-2xl text-charcoal mb-2">
                  {course.courseNumber}: {course.courseName}
                </h2>
                <div className="font-serif text-sm text-charcoal/70 space-y-1">
                  <p>{course.offeringCount} past offerings • {course.professorCount} professors</p>
                  <p>Last offered: {course.lastOffered}</p>
                </div>
              </div>
              <div className="text-right">
                {course.needsTA && (
                  course.currentOffering && isActiveSemester(course.currentOffering.season, course.currentOffering.year) ? (
                    <UnclaimedTAMarker 
                      courseId={course.id}
                      semesterId={course.currentOffering.id}
                      className="font-serif text-sm"
                    />
                  ) : (
                    <span className="font-serif text-sm uppercase tracking-wider text-charcoal border border-charcoal px-3 py-1">
                      No Head TA Recorded
                    </span>
                  )
                )}
                {course.currentOffering && !course.needsTA && (
                  <span className="font-serif text-sm text-charcoal/70">
                    {course.currentTAs} current TA{course.currentTAs !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// Course list skeleton - reuse from loading.tsx
function CourseListSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border-b border-charcoal/10 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="font-serif text-2xl text-charcoal mb-2">
                <div className="h-7 bg-charcoal/10 rounded animate-pulse" style={{ width: '60%' }} />
              </h2>
              <div className="font-serif text-sm text-charcoal/70 space-y-1">
                <div className="h-4 w-48 bg-charcoal/10 rounded animate-pulse" />
                <div className="h-4 w-64 bg-charcoal/10 rounded animate-pulse" />
                <div className="h-4 w-44 bg-charcoal/10 rounded animate-pulse" />
              </div>
            </div>
            <div className="text-right">
              <div className="h-7 w-24 bg-charcoal/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function CoursesPage({ searchParams }: FilterProps) {
  return (
    <CleanLayout maxWidth="7xl">
      <CleanPageHeader
        title="Course Directory"
        description="Explore all courses with head TA support"
      />

      {/* Search and Filters with Suspense */}
      <Suspense fallback={<SearchFiltersSkeleton />}>
        <CourseSearchFilters searchParams={searchParams} />
      </Suspense>

      {/* Course List with Suspense */}
      <Suspense fallback={<CourseListSkeleton />}>
        <CourseList searchParams={searchParams} />
      </Suspense>

      <div className="mt-16 text-center">
        <Link
          href="/"
          className="font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
        >
          Back to home
        </Link>
      </div>
    </CleanLayout>
  );
}