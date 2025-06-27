import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { professorRepository } from "@/lib/repositories/professors";
import { courseOfferingRepository } from "@/lib/repositories/course-offerings";
import CleanLayout, { CleanPageHeader } from "@/components/layout/CleanLayout";
import type { CourseOfferingWithRelations } from "@/lib/types";
import { UnclaimedTAMarker } from "@/components/ta/UnclaimedTAMarker";
import { isSemesterCurrent, isSemesterFuture, parseSemester } from "@/lib/semester-utils";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    professorId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const professor = await professorRepository.findById(resolvedParams.professorId);
  
  if (!professor) {
    return {
      title: "Professor Not Found",
    };
  }

  return {
    title: `${professor.firstName} ${professor.lastName} - WU Head TA Directory`,
    description: `Courses taught by ${professor.firstName} ${professor.lastName}`,
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

export default async function ProfessorDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const professor = await professorRepository.findWithCourseOfferings(resolvedParams.professorId);

  if (!professor) {
    notFound();
  }

  // Get all offerings with full relations using the basic find by professor ID
  const basicOfferings = await courseOfferingRepository.findByProfessorId(professor.id);
  
  // Get the detailed offerings with relations
  const offerings = await Promise.all(
    basicOfferings.map(async (offering) => {
      return await courseOfferingRepository.findWithRelations(offering.id);
    })
  ).then(results => results.filter(Boolean) as CourseOfferingWithRelations[]);

  // Get current semester offerings
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentSeason = currentMonth >= 8 ? "Fall" : "Spring";
  const currentOfferings = offerings.filter(o => 
    o.year === currentYear && o.season === currentSeason
  );

  // Group by course
  const courseGroups = offerings.reduce((acc, offering) => {
    const courseId = offering.course?.id || "";
    if (!acc[courseId] && offering.course) {
      acc[courseId] = {
        course: offering.course,
        offerings: [],
      };
    }
    if (offering.course) {
      acc[courseId].offerings.push(offering);
    }
    return acc;
  }, {} as Record<string, { course: { id: string; courseNumber: string; courseName: string }; offerings: typeof offerings }>);

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
    <CleanLayout maxWidth="4xl">
      <div className="mb-12">
        <Link
          href="/professors"
          className="font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200 inline-flex items-center mb-8"
        >
          ← Back to professors
        </Link>
        <CleanPageHeader
          title={`${professor.firstName} ${professor.lastName}`}
          subtitle={professor.email}
        />
      </div>

      {/* Current Courses */}
      {currentOfferings.length > 0 && (
        <section className="mb-16">
          <h2 className="font-serif text-xl text-charcoal mb-4">
            Currently Teaching • {currentSeason} {currentYear}
          </h2>
          <div className="space-y-3">
            {currentOfferings.map((offering) => (
              <div key={offering.id} className="border-l-2 border-charcoal/20 pl-4">
                <Link
                  href={`/courses/${offering.course?.courseNumber}`}
                  className="font-serif text-lg text-charcoal hover:opacity-70 transition-opacity duration-200"
                >
                  {offering.course?.courseNumber}: {offering.course?.courseName}
                </Link>
                {offering.taAssignments && offering.taAssignments.length === 0 && (
                  isActiveSemester(offering.season, offering.year) ? (
                    <UnclaimedTAMarker 
                      courseId={offering.course?.id}
                      semesterId={offering.id}
                      className="ml-2 text-sm"
                    />
                  ) : (
                    <span className="ml-2 text-sm text-red-800">(No Head TA Recorded)</span>
                  )
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Summary Statistics */}
      <section className="mb-16">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="font-serif text-4xl text-charcoal mb-2">
              {Object.keys(courseGroups).length}
            </p>
            <p className="text-xs uppercase tracking-wider text-charcoal/60">
              Unique Courses
            </p>
          </div>

          <div>
            <p className="font-serif text-4xl text-charcoal mb-2">
              {offerings.length}
            </p>
            <p className="text-xs uppercase tracking-wider text-charcoal/60">
              Total Offerings
            </p>
          </div>

          <div>
            <p className="font-serif text-4xl text-charcoal mb-2">
              {uniqueTAs.size}
            </p>
            <p className="text-xs uppercase tracking-wider text-charcoal/60">
              Head TAs Worked With
            </p>
          </div>
        </div>
      </section>

      {/* Courses Taught */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl text-charcoal mb-8">Courses Taught</h2>
        <div className="space-y-12">
          {Object.values(courseGroups)
            .sort((a, b) => (a.course?.courseNumber || "").localeCompare(b.course?.courseNumber || ""))
            .map((group) => (
              <div key={group.course?.id} className="border-t border-charcoal/20 pt-8">
                <h3 className="font-serif text-xl text-charcoal mb-2">
                  <Link
                    href={`/courses/${group.course?.courseNumber}`}
                    className="hover:opacity-70 transition-opacity duration-200"
                  >
                    {group.course?.courseNumber}: {group.course?.courseName}
                  </Link>
                </h3>
                <p className="font-serif text-sm italic text-charcoal/60 mb-6">
                  Taught {group.offerings.length} time{group.offerings.length !== 1 ? "s" : ""}
                </p>
                <div className="space-y-6">
                  {group.offerings
                    .sort((a, b) => b.year - a.year || b.season.localeCompare(a.season))
                    .map((offering) => (
                      <div
                        key={offering.id}
                        className="pl-8 border-l-2 border-charcoal/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-serif text-lg text-charcoal">
                            {offering.season} {offering.year}
                          </p>
                          <Link
                            href={`/semesters/${offering.semester}`}
                            className="font-serif text-sm text-charcoal hover:opacity-70 transition-opacity duration-200"
                          >
                            View semester →
                          </Link>
                        </div>
                        {offering.taAssignments && offering.taAssignments.length > 0 && (
                          <div>
                            <p className="text-xs uppercase tracking-wider text-charcoal/60 mb-2">Head TAs:</p>
                            <div className="flex flex-wrap gap-2">
                              {offering.taAssignments.map((assignment) => (
                                <Link
                                  key={assignment.id}
                                  href={`/profile/${assignment.user?.id}`}
                                  className="font-serif text-sm text-charcoal hover:opacity-70 transition-opacity duration-200"
                                >
                                  {assignment.user?.firstName} {assignment.user?.lastName}
                                </Link>
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
      </section>

      {/* All Head TAs */}
      <section>
        <h2 className="font-serif text-2xl text-charcoal mb-4">Head TAs Worked With</h2>
        <p className="font-serif text-base text-charcoal/60 mb-8">
          All head TAs who have worked with {professor.firstName} {professor.lastName}
        </p>
        <div className="space-y-4">
          {Array.from(uniqueTAs.values())
            .sort((a, b) => a.lastName.localeCompare(b.lastName))
            .map((ta) => (
              <Link
                key={ta.id}
                href={`/profile/${ta.id}`}
                className="block border-t border-charcoal/20 pt-4 hover:opacity-70 transition-opacity duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-serif text-lg text-charcoal">
                      {ta.firstName} {ta.lastName}
                    </p>
                    <p className="text-sm text-charcoal/60">
                      {ta.gradYear && `Class of ${ta.gradYear}`}
                      {ta.currentRole && ` • ${ta.currentRole}`}
                    </p>
                  </div>
                  <span className="font-serif text-charcoal">→</span>
                </div>
              </Link>
            ))}
        </div>
      </section>
    </CleanLayout>
  );
}