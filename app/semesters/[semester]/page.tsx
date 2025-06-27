import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { courseOfferings, courses, professors, taAssignments, users } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import CleanLayout, { CleanPageHeader } from "@/components/layout/CleanLayout";
import { UnclaimedTAMarker } from "@/components/ta/UnclaimedTAMarker";
import { isSemesterCurrent, isSemesterFuture, parseSemester } from "@/lib/semester-utils";

interface PageProps {
  params: Promise<{
    semester: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `${resolvedParams.semester} - WU Head TA Directory`,
    description: `Head TAs and courses for ${resolvedParams.semester}`,
  };
}

async function getSemesterData(semester: string) {
  // Get all course offerings for this semester with related data
  const offerings = await db
    .select({
      offering: courseOfferings,
      course: courses,
      professor: professors,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .leftJoin(professors, eq(courseOfferings.professorId, professors.id))
    .where(eq(courseOfferings.semester, semester));

  if (offerings.length === 0) {
    return null;
  }

  // Get all TAs for these offerings
  const offeringIds = offerings.map(o => o.offering.id);
  const tas = await db
    .select({
      assignment: taAssignments,
      user: users,
      courseOfferingId: taAssignments.courseOfferingId,
    })
    .from(taAssignments)
    .innerJoin(users, eq(taAssignments.userId, users.id))
    .where(inArray(taAssignments.courseOfferingId, offeringIds));

  // Group TAs by course offering
  const tasByOffering = tas.reduce((acc, ta) => {
    const offeringId = ta.courseOfferingId;
    if (!acc[offeringId]) {
      acc[offeringId] = [];
    }
    acc[offeringId].push(ta);
    return acc;
  }, {} as Record<string, typeof tas>);

  return {
    semester: offerings[0].offering.semester,
    year: offerings[0].offering.year,
    season: offerings[0].offering.season,
    offerings: offerings.map(o => ({
      ...o,
      tas: tasByOffering[o.offering.id] || [],
    })).sort((a, b) => a.course.courseNumber.localeCompare(b.course.courseNumber)),
  };
}

// Helper function to check if a semester is active (current or future)
function isActiveSemester(season: string, year: number): boolean {
  try {
    const semester = parseSemester(`${season} ${year}`);
    return isSemesterCurrent(semester) || isSemesterFuture(semester);
  } catch {
    return false;
  }
}

export default async function SemesterDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const semesterData = await getSemesterData(resolvedParams.semester);

  if (!semesterData) {
    notFound();
  }

  // Calculate statistics
  const totalCourses = semesterData.offerings.length;
  const coursesWithTAs = semesterData.offerings.filter(o => o.tas.length > 0).length;
  const coursesNeedingTAs = totalCourses - coursesWithTAs;

  return (
    <CleanLayout maxWidth="6xl">
      <div className="mb-12">
        <Link
          href="/semesters"
          className="font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200 inline-flex items-center"
        >
          <svg
            className="mr-2 h-3 w-3"
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
          All Semesters
        </Link>
      </div>
      
      <CleanPageHeader
        title={`${semesterData.season} ${semesterData.year}`}
        subtitle={`${semesterData.offerings.length} courses offered this semester`}
      />

      {/* Summary Statistics */}
      <div className="mb-16 pb-8 border-b border-charcoal/10">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div className="font-serif">
            <p className="text-4xl text-charcoal">{totalCourses}</p>
            <p className="text-sm uppercase tracking-wider text-charcoal/60 mt-2">Total Courses</p>
          </div>
          <div className="font-serif">
            <p className="text-4xl text-charcoal">{coursesWithTAs}</p>
            <p className="text-sm uppercase tracking-wider text-charcoal/60 mt-2">With TAs</p>
          </div>
          <div className="font-serif">
            <p className="text-4xl text-charcoal">{coursesNeedingTAs}</p>
            <p className="text-sm uppercase tracking-wider text-charcoal/60 mt-2">Need TAs</p>
          </div>
        </div>
      </div>

      {/* Course Listings */}
      <div className="space-y-0">
        {semesterData.offerings.map((offering) => {
          const requiredTAs = 1; // This could be configurable per course
          const currentTAs = offering.tas.length;
          
          return (
            <div 
              key={offering.offering.id} 
              className="border-b border-charcoal/10 py-6 sm:py-8 hover:opacity-80 transition-opacity duration-200"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-8">
                {/* Course Number - Full width on mobile */}
                <div className="sm:col-span-2">
                  <Link
                    href={`/courses/${offering.course.courseNumber}`}
                    className="font-serif text-base sm:text-lg text-charcoal hover:opacity-70 transition-opacity duration-200 inline-block"
                  >
                    {offering.course.courseNumber}
                  </Link>
                </div>
                
                {/* Course Details */}
                <div className="sm:col-span-7">
                  <h3 className="font-serif text-base sm:text-lg text-charcoal mb-2">
                    {offering.course.courseName}
                  </h3>
                  
                  {offering.professor && (
                    <p className="font-serif text-xs sm:text-sm text-charcoal/60">
                      Taught by{" "}
                      <Link
                        href={`/professors/${offering.professor.id}`}
                        className="text-charcoal underline hover:no-underline"
                      >
                        {offering.professor.firstName} {offering.professor.lastName}
                      </Link>
                    </p>
                  )}
                  {!offering.professor && (
                    <p className="font-serif text-xs sm:text-sm italic text-charcoal/40">
                      No professor assigned
                    </p>
                  )}
                  
                  {offering.tas.length > 0 && (
                    <div className="mt-3 sm:mt-4">
                      <p className="font-serif text-xs sm:text-sm uppercase tracking-wider text-charcoal/60 mb-1 sm:mb-2">
                        Head Teaching Assistants
                      </p>
                      <div className="flex flex-wrap gap-2 sm:gap-4">
                        {offering.tas.map((ta) => (
                          <Link
                            key={ta.assignment.id}
                            href={`/profile/${ta.user.id}`}
                            className="font-serif text-xs sm:text-sm text-charcoal underline hover:no-underline"
                          >
                            {ta.user.firstName} {ta.user.lastName}
                            {ta.assignment.hoursPerWeek && (
                              <span className="text-charcoal/60 ml-1">
                                ({ta.assignment.hoursPerWeek}h)
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* TA Status - Below content on mobile */}
                <div className="sm:col-span-3 mt-3 sm:mt-0 sm:text-right">
                  {currentTAs === 0 ? (
                    isActiveSemester(semesterData.season, semesterData.year) ? (
                      <UnclaimedTAMarker 
                        courseId={offering.course.id}
                        semesterId={offering.offering.id}
                        className="font-serif text-xs sm:text-sm"
                      />
                    ) : (
                      <span className="font-serif text-xs sm:text-sm italic text-charcoal/60">
                        No Head TA Recorded
                      </span>
                    )
                  ) : (
                    <span className="font-serif text-xs sm:text-sm text-charcoal/60">
                      {currentTAs} of {requiredTAs} TA{requiredTAs > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CleanLayout>
  );
}