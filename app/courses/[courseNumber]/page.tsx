import { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { courseRepository } from "@/lib/repositories/courses";
import { courseOfferingRepository } from "@/lib/repositories/course-offerings";
import CleanLayout from "@/components/layout/CleanLayout";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    courseNumber: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const course = await courseRepository.findByCourseNumber(decodeURIComponent(resolvedParams.courseNumber));
  
  if (!course) {
    return {
      title: "Course Not Found",
    };
  }

  return {
    title: `${course.courseNumber}: ${course.courseName} - WU Head TA Directory`,
    description: `Head TA history for ${course.courseName}`,
  };
}

// Course header skeleton
function CourseHeaderSkeleton() {
  return (
    <div className="mb-12">
      <div className="h-4 w-32 bg-charcoal/10 rounded mb-8 animate-pulse" />
      <div className="h-10 w-3/4 bg-charcoal/10 rounded mb-4 animate-pulse" />
      <div className="flex space-x-4">
        <div className="h-4 w-32 bg-charcoal/10 rounded animate-pulse" />
        <div className="h-4 w-40 bg-charcoal/10 rounded animate-pulse" />
        <div className="h-4 w-28 bg-charcoal/10 rounded animate-pulse" />
      </div>
    </div>
  );
}

// Course stats skeleton
function CourseStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
      {[1, 2, 3].map((i) => (
        <div key={i} className="text-center">
          <div className="h-12 w-16 bg-charcoal/10 rounded mx-auto mb-2 animate-pulse" />
          <div className="h-4 w-24 bg-charcoal/10 rounded mx-auto animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// Timeline skeleton
function TimelineSkeleton() {
  return (
    <div className="mb-12">
      <div className="h-8 w-48 bg-charcoal/10 rounded mb-6 animate-pulse" />
      <div className="h-64 bg-charcoal/5 rounded animate-pulse" />
    </div>
  );
}

// Detailed history skeleton
function DetailedHistorySkeleton() {
  return (
    <div className="mb-12">
      <div className="h-8 w-48 bg-charcoal/10 rounded mb-6 animate-pulse" />
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-6 w-48 bg-charcoal/10 rounded mb-4 animate-pulse" />
            <div className="space-y-6">
              {[1, 2].map((j) => (
                <div key={j} className="border-l-2 border-charcoal/20 pl-6">
                  <div className="h-5 w-32 bg-charcoal/10 rounded mb-2 animate-pulse" />
                  <div className="h-4 w-48 bg-charcoal/10 rounded mb-2 animate-pulse" />
                  <div className="h-4 w-64 bg-charcoal/10 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// All TAs skeleton
function AllTAsSkeleton() {
  return (
    <div className="border-t border-charcoal/10 pt-12">
      <div className="h-8 w-32 bg-charcoal/10 rounded mb-2 animate-pulse" />
      <div className="h-4 w-96 bg-charcoal/10 rounded mb-8 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center justify-between border-b border-charcoal/10 pb-4">
            <div>
              <div className="h-5 w-32 bg-charcoal/10 rounded mb-2 animate-pulse" />
              <div className="h-4 w-48 bg-charcoal/10 rounded animate-pulse" />
            </div>
            <div className="h-5 w-5 bg-charcoal/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Server component for course header
async function CourseHeader({ courseNumber }: { courseNumber: string }) {
  const course = await courseRepository.findByCourseNumber(decodeURIComponent(courseNumber));

  if (!course) {
    notFound();
  }

  const offerings = await courseOfferingRepository.findWithRelationsByCourseId(course.id);
  
  const uniqueTAs = new Set();
  const uniqueProfessors = new Set();

  offerings.forEach(offering => {
    if (offering.professor) {
      uniqueProfessors.add(offering.professor.id);
    }
    offering.taAssignments?.forEach(assignment => {
      if (assignment.user) {
        uniqueTAs.add(assignment.user.id);
      }
    });
  });

  return (
    <>
      <div className="mb-12">
        <Link
          href="/courses"
          className="font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200 inline-flex items-center mb-8"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to courses
        </Link>
        <h1 className="font-serif text-4xl text-charcoal mb-4">
          {course.courseNumber}: {course.courseName}
        </h1>
        <div className="font-serif text-sm text-charcoal/70 space-x-4">
          <span>{offerings.length} total offerings</span>
          <span>• {uniqueTAs.size} unique head TAs</span>
          <span>• {uniqueProfessors.size} professors</span>
        </div>
      </div>
    </>
  );
}

// Server component for course stats
async function CourseStats({ courseNumber }: { courseNumber: string }) {
  const course = await courseRepository.findByCourseNumber(decodeURIComponent(courseNumber));
  if (!course) return null;

  const offerings = await courseOfferingRepository.findWithRelationsByCourseId(course.id);
  
  const uniqueTAs = new Set();
  const uniqueProfessors = new Set();

  offerings.forEach(offering => {
    if (offering.professor) {
      uniqueProfessors.add(offering.professor.id);
    }
    offering.taAssignments?.forEach(assignment => {
      if (assignment.user) {
        uniqueTAs.add(assignment.user.id);
      }
    });
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
      <div className="text-center">
        <div className="font-serif text-4xl text-charcoal mb-2">
          {uniqueTAs.size}
        </div>
        <div className="font-serif text-sm uppercase tracking-wider text-charcoal/70">
          Total Head TAs
        </div>
      </div>

      <div className="text-center">
        <div className="font-serif text-4xl text-charcoal mb-2">
          {offerings.length}
        </div>
        <div className="font-serif text-sm uppercase tracking-wider text-charcoal/70">
          Total Offerings
        </div>
      </div>

      <div className="text-center">
        <div className="font-serif text-4xl text-charcoal mb-2">
          {uniqueProfessors.size}
        </div>
        <div className="font-serif text-sm uppercase tracking-wider text-charcoal/70">
          Professors
        </div>
      </div>
    </div>
  );
}

// Server component for course content
async function CourseContent({ courseNumber }: { courseNumber: string }) {
  const { CourseTimeline } = await import("@/components/course/CourseTimeline");
  const { CourseOfferingManagementWrapper } = await import("@/components/course/CourseOfferingManagementWrapper");
  const { HeadTAStatusDisplay } = await import("@/components/ta/HTAStatusDisplay");
  const { UnclaimedTAMarker } = await import("@/components/ta/UnclaimedTAMarker");
  const { isSemesterCurrent, isSemesterFuture, parseSemester } = await import("@/lib/semester-utils");
  
  const course = await courseRepository.findByCourseNumber(decodeURIComponent(courseNumber));
  if (!course) return null;

  const offerings = await courseOfferingRepository.findWithRelationsByCourseId(course.id);

  // Helper function to check if a semester is active
  function isActiveSemester(season: string, year: number): boolean {
    try {
      const semester = parseSemester(`${season} ${year}`);
      return isSemesterCurrent(semester) || isSemesterFuture(semester);
    } catch {
      return false;
    }
  }

  // Group offerings by academic year
  const offeringsByYear = offerings.reduce((acc, offering) => {
    const academicYear = offering.season === "Fall" 
      ? `${offering.year}-${offering.year + 1}`
      : `${offering.year - 1}-${offering.year}`;
    
    if (!acc[academicYear]) {
      acc[academicYear] = [];
    }
    acc[academicYear].push(offering);
    return acc;
  }, {} as Record<string, typeof offerings>);

  // Get unique TAs
  const uniqueTAs = new Map();
  offerings.forEach(offering => {
    offering.taAssignments?.forEach(assignment => {
      if (assignment.user) {
        uniqueTAs.set(assignment.user.id, assignment.user);
      }
    });
  });

  return (
    <>
      {/* Course Management Wrapper - handles auth checks */}
      <CourseOfferingManagementWrapper
        courseId={course.id}
        courseNumber={course.courseNumber}
        courseName={course.courseName}
        offerings={offerings.map(offering => ({
          id: offering.id,
          courseId: offering.courseId,
          courseNumber: course.courseNumber,
          courseName: course.courseName,
          semester: offering.semester,
          year: offering.year,
          season: offering.season,
          professor: offering.professor,
          taAssignments: offering.taAssignments?.map(ta => ({
            id: ta.id,
            user: ta.user!,
            hoursPerWeek: ta.hoursPerWeek || 0
          })) || []
        }))}
      />

      {/* Visual Timeline */}
      <div className="mb-12">
        <h2 className="font-serif text-2xl text-charcoal mb-6">Course Timeline</h2>
        <CourseTimeline courses={offerings.map(offering => ({
          id: offering.id,
          code: course.courseNumber,
          name: course.courseName,
          semester: offering.season,
          year: offering.year,
          startDate: new Date(offering.year, offering.season === 'Fall' ? 8 : 0, 1),
          endDate: new Date(offering.year, offering.season === 'Fall' ? 11 : 4, 31),
          tas: offering.taAssignments?.map(ta => ({
            id: ta.id,
            name: `${ta.user?.firstName} ${ta.user?.lastName}`
          })) || [],
          maxTAs: 1
        }))} />
      </div>

      {/* Timeline of offerings */}
      <div className="mb-12">
        <h2 className="font-serif text-2xl text-charcoal mb-6">Detailed History</h2>
        <div className="space-y-8">
          {Object.entries(offeringsByYear)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([academicYear, yearOfferings]) => (
              <div key={academicYear}>
                <h3 className="font-serif text-xl text-charcoal mb-4">
                  {academicYear} Academic Year
                </h3>
                <div className="space-y-6">
                  {yearOfferings
                    .sort((a, b) => b.season.localeCompare(a.season))
                    .map((offering) => (
                      <div
                        key={offering.id}
                        className="border-l-2 border-charcoal/20 pl-6"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-serif text-lg text-charcoal">
                              {offering.season} {offering.year}
                            </h4>
                            {(!offering.taAssignments || offering.taAssignments.length === 0) && (
                              <div className="mt-2">
                                {isActiveSemester(offering.season, offering.year) ? (
                                  <UnclaimedTAMarker 
                                    courseId={offering.courseId}
                                    semesterId={offering.id}
                                    className="font-serif text-sm"
                                  />
                                ) : (
                                  <HeadTAStatusDisplay 
                                    ta={undefined}
                                    className="font-serif text-sm"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                          <Link
                            href={`/semesters/${offering.semester}`}
                            className="font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
                          >
                            View semester
                          </Link>
                        </div>
                        {offering.professor && (
                          <p className="font-serif text-sm text-charcoal/70 mb-2">
                            Professor:{" "}
                            <Link
                              href={`/professors/${offering.professor.id}`}
                              className="text-charcoal hover:opacity-70 transition-opacity duration-200"
                            >
                              {offering.professor.firstName} {offering.professor.lastName}
                            </Link>
                          </p>
                        )}
                        {!offering.professor && (
                          <p className="font-serif text-sm text-charcoal/70 mb-2">
                            No professor assigned
                          </p>
                        )}
                        {offering.taAssignments && offering.taAssignments.length > 0 && (
                          <div>
                            <p className="font-serif text-sm text-charcoal/70 mb-2">Head TAs:</p>
                            <div className="flex flex-wrap gap-3">
                              {offering.taAssignments.map((assignment) => (
                                <div key={assignment.id} className="flex items-center gap-2">
                                  <HeadTAStatusDisplay 
                                    ta={assignment.user}
                                    showInviteButton={true}
                                    className="font-serif text-sm"
                                  />
                                  {assignment.hoursPerWeek && (
                                    <span className="font-serif text-sm text-charcoal/70">
                                      ({assignment.hoursPerWeek}h)
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* All Head TAs */}
      <div className="border-t border-charcoal/10 pt-12">
        <h2 className="font-serif text-2xl text-charcoal mb-2">All Head TAs</h2>
        <p className="font-serif text-sm text-charcoal/70 mb-8">
          Complete list of head TAs who have taught this course
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from(uniqueTAs.values()).map((ta) => (
            <div key={ta.id} className="group block">
              <div className="flex items-center justify-between border-b border-charcoal/10 pb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <HeadTAStatusDisplay 
                      ta={ta}
                      showInviteButton={true}
                      className="font-serif text-lg"
                    />
                  </div>
                  <p className="font-serif text-sm text-charcoal/70 mt-1">
                    {ta.gradYear && `Class of ${ta.gradYear}`}
                    {ta.currentRole && ` • ${ta.currentRole}`}
                  </p>
                </div>
                <Link
                  href={`/profile/${ta.id}`}
                  className="group-hover:text-charcoal/60 transition-colors duration-200"
                >
                  <svg
                    className="h-5 w-5 text-charcoal/40"
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
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default async function CourseDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  return (
    <CleanLayout maxWidth="7xl">
      {/* Course Header with Suspense */}
      <Suspense fallback={<CourseHeaderSkeleton />}>
        <CourseHeader courseNumber={decodeURIComponent(resolvedParams.courseNumber)} />
      </Suspense>

      {/* Course Stats with Suspense */}
      <Suspense fallback={<CourseStatsSkeleton />}>
        <CourseStats courseNumber={decodeURIComponent(resolvedParams.courseNumber)} />
      </Suspense>

      {/* Course Content with Suspense */}
      <Suspense fallback={
        <>
          <TimelineSkeleton />
          <DetailedHistorySkeleton />
          <AllTAsSkeleton />
        </>
      }>
        <CourseContent courseNumber={decodeURIComponent(resolvedParams.courseNumber)} />
      </Suspense>
    </CleanLayout>
  );
}