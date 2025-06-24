import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { courseRepository } from "@/lib/repositories/courses";
import { courseOfferingRepository } from "@/lib/repositories/course-offerings";
import { CourseTimeline } from "@/components/course/CourseTimeline";
import { MissingTAIndicator } from "@/components/course/MissingTAIndicator";
import { CourseOfferingManagement } from "@/components/course/CourseOfferingManagement";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface PageProps {
  params: {
    courseNumber: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const course = await courseRepository.findByCourseNumber(params.courseNumber);
  
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

export default async function CourseDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'admin';
  const course = await courseRepository.findByCourseNumber(params.courseNumber);

  if (!course) {
    notFound();
  }

  // Get all offerings with full relations
  const offerings = await courseOfferingRepository.findWithRelationsByCourseId(course.id);

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

  // Get unique TAs and professors
  const uniqueTAs = new Map();
  const uniqueProfessors = new Map();

  offerings.forEach(offering => {
    if (offering.professor) {
      uniqueProfessors.set(offering.professor.id, offering.professor);
    }
    offering.taAssignments?.forEach(assignment => {
      if (assignment.user) {
        uniqueTAs.set(assignment.user.id, assignment.user);
      }
    });
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href="/courses"
            className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center"
          >
            <svg
              className="mr-1 h-4 w-4"
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
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900">
            {course.courseNumber}: {course.courseName}
          </h1>
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
            <span>
              {course.offeringPattern === "both" && "Offered Fall & Spring"}
              {course.offeringPattern === "fall_only" && "Fall Only"}
              {course.offeringPattern === "spring_only" && "Spring Only"}
              {course.offeringPattern === "sparse" && "Occasionally Offered"}
            </span>
            <span>• {offerings.length} total offerings</span>
            <span>• {uniqueTAs.size} unique head TAs</span>
            <span>• {uniqueProfessors.size} professors</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Head TAs
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {uniqueTAs.size}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Offerings
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {offerings.length}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Professors
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {uniqueProfessors.size}
              </dd>
            </div>
          </div>
        </div>

        {/* Course Management for Admins */}
        {isAdmin && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Manage Course Offerings</h2>
            <CourseOfferingManagement
              courseId={course.id}
              courseNumber={course.courseNumber}
              courseName={course.courseName}
              offerings={offerings}
              onUpdate={() => {
                // In a real app, we'd refresh the data here
                window.location.reload();
              }}
            />
          </div>
        )}

        {/* Visual Timeline */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Course Timeline</h2>
          <CourseTimeline offerings={offerings} />
        </div>

        {/* Timeline of offerings */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Detailed History</h2>
          </div>
          <div className="border-t border-gray-200">
            {Object.entries(offeringsByYear)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([academicYear, yearOfferings]) => (
                <div key={academicYear} className="px-4 py-5 sm:px-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4">
                    {academicYear} Academic Year
                  </h3>
                  <div className="space-y-4">
                    {yearOfferings
                      .sort((a, b) => b.season.localeCompare(a.season))
                      .map((offering) => (
                        <div
                          key={offering.id}
                          className="border-l-4 border-indigo-200 pl-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {offering.season} {offering.year}
                              </h4>
                              {(!offering.taAssignments || offering.taAssignments.length === 0) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Missing TA
                                </span>
                              )}
                            </div>
                            <Link
                              href={`/semesters/${offering.semester}`}
                              className="text-sm text-indigo-600 hover:text-indigo-500"
                            >
                              View semester
                            </Link>
                          </div>
                          {offering.professor && (
                            <p className="mt-1 text-sm text-gray-600">
                              Professor:{" "}
                              <Link
                                href={`/professors/${offering.professor.id}`}
                                className="text-indigo-600 hover:text-indigo-500"
                              >
                                {offering.professor.firstName} {offering.professor.lastName}
                              </Link>
                            </p>
                          )}
                          {!offering.professor && (
                            <p className="mt-1 text-sm text-yellow-600">
                              No professor assigned
                            </p>
                          )}
                          <div className="mt-2">
                            <MissingTAIndicator
                              currentTAs={offering.taAssignments?.length || 0}
                              requiredTAs={1}
                              size="sm"
                              showLabel={false}
                            />
                          </div>
                          {offering.taAssignments && offering.taAssignments.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">Head TAs:</p>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {offering.taAssignments.map((assignment) => (
                                  <Link
                                    key={assignment.id}
                                    href={`/people/${assignment.user?.id}`}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                                  >
                                    {assignment.user?.firstName} {assignment.user?.lastName}
                                    {assignment.hoursPerWeek && (
                                      <span className="ml-1 text-indigo-600">
                                        ({assignment.hoursPerWeek}h)
                                      </span>
                                    )}
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
        </div>

        {/* All Head TAs */}
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">All Head TAs</h2>
            <p className="mt-1 text-sm text-gray-500">
              Complete list of head TAs who have taught this course
            </p>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {Array.from(uniqueTAs.values()).map((ta) => (
                <li key={ta.id}>
                  <Link
                    href={`/people/${ta.id}`}
                    className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-indigo-600">
                          {ta.firstName} {ta.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {ta.gradYear && `Class of ${ta.gradYear}`}
                          {ta.currentRole && ` • ${ta.currentRole}`}
                        </p>
                      </div>
                      <svg
                        className="h-5 w-5 text-gray-400"
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
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}