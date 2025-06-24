import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { courseOfferings, courses, professors, taAssignments, users } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { MissingTAIndicator } from "@/components/course/MissingTAIndicator";

interface PageProps {
  params: {
    semester: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `${params.semester} - WU Head TA Directory`,
    description: `Head TAs and courses for ${params.semester}`,
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

export default async function SemesterDetailPage({ params }: PageProps) {
  const semesterData = await getSemesterData(params.semester);

  if (!semesterData) {
    notFound();
  }

  // Calculate statistics
  const totalCourses = semesterData.offerings.length;
  const coursesWithTAs = semesterData.offerings.filter(o => o.tas.length > 0).length;
  const coursesNeedingTAs = totalCourses - coursesWithTAs;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href="/semesters"
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
            Back to semesters
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900">
            {semesterData.season} {semesterData.year}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {semesterData.offerings.length} courses offered this semester
          </p>
        </div>

        {/* Summary Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Total Courses</p>
            <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Courses with TAs</p>
            <p className="text-2xl font-bold text-green-600">{coursesWithTAs}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Courses Needing TAs</p>
            <p className="text-2xl font-bold text-red-600">{coursesNeedingTAs}</p>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="divide-y divide-gray-200">
            {semesterData.offerings.map((offering) => {
              const requiredTAs = 1; // This could be configurable per course
              const currentTAs = offering.tas.length;
              
              return (
                <div key={offering.offering.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/courses/${offering.course.courseNumber}`}
                          className="text-lg font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          {offering.course.courseNumber}: {offering.course.courseName}
                        </Link>
                        {currentTAs === 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            No TA assigned
                          </span>
                        )}
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
                    </div>
                    <div className="ml-4 w-32">
                      <MissingTAIndicator
                        currentTAs={currentTAs}
                        requiredTAs={requiredTAs}
                        size="md"
                      />
                    </div>
                  </div>

                  {offering.tas.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900">Head TAs:</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {offering.tas.map((ta) => (
                          <Link
                            key={ta.assignment.id}
                            href={`/people/${ta.user.id}`}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                          >
                            {ta.user.firstName} {ta.user.lastName}
                            {ta.assignment.hoursPerWeek && (
                              <span className="ml-1 text-xs text-indigo-600">
                                ({ta.assignment.hoursPerWeek}h/week)
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}