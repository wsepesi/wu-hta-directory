import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { professorRepository } from "@/lib/repositories/professors";
import { courseOfferingRepository } from "@/lib/repositories/course-offerings";

interface PageProps {
  params: {
    professorId: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const professor = await professorRepository.findById(params.professorId);
  
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

export default async function ProfessorDetailPage({ params }: PageProps) {
  const professor = await professorRepository.findById(params.professorId);

  if (!professor) {
    notFound();
  }

  // Get all offerings with full relations
  const offerings = await courseOfferingRepository.findWithRelationsByProfessorId(professor.id);

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
    if (!acc[courseId]) {
      acc[courseId] = {
        course: offering.course,
        offerings: [],
      };
    }
    acc[courseId].offerings.push(offering);
    return acc;
  }, {} as Record<string, { course: any; offerings: typeof offerings }>);

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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href="/professors"
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
            Back to professors
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900">
            {professor.firstName} {professor.lastName}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            <a
              href={`mailto:${professor.email}`}
              className="text-indigo-600 hover:text-indigo-500"
            >
              {professor.email}
            </a>
          </p>
        </div>

        {/* Current Courses */}
        {currentOfferings.length > 0 && (
          <div className="mb-8 bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Currently Teaching ({currentSeason} {currentYear})
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {currentOfferings.map((offering) => (
                      <li key={offering.id}>
                        <Link
                          href={`/courses/${offering.course?.courseNumber}`}
                          className="font-medium hover:underline"
                        >
                          {offering.course?.courseNumber}: {offering.course?.courseName}
                        </Link>
                        {offering.taAssignments && offering.taAssignments.length === 0 && (
                          <span className="ml-2 text-red-600">(Needs TA)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Unique Courses
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {Object.keys(courseGroups).length}
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
                Head TAs Worked With
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {uniqueTAs.size}
              </dd>
            </div>
          </div>
        </div>

        {/* Courses Taught */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Courses Taught</h2>
          </div>
          <div className="border-t border-gray-200">
            {Object.values(courseGroups)
              .sort((a, b) => (a.course?.courseNumber || "").localeCompare(b.course?.courseNumber || ""))
              .map((group) => (
                <div key={group.course?.id} className="px-4 py-5 sm:px-6">
                  <h3 className="text-base font-medium text-gray-900">
                    <Link
                      href={`/courses/${group.course?.courseNumber}`}
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      {group.course?.courseNumber}: {group.course?.courseName}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Taught {group.offerings.length} time{group.offerings.length !== 1 ? "s" : ""}
                  </p>
                  <div className="mt-3 space-y-3">
                    {group.offerings
                      .sort((a, b) => b.year - a.year || b.season.localeCompare(a.season))
                      .map((offering) => (
                        <div
                          key={offering.id}
                          className="border-l-4 border-gray-200 pl-4"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {offering.season} {offering.year}
                            </p>
                            <Link
                              href={`/semesters/${offering.semester}`}
                              className="text-sm text-indigo-600 hover:text-indigo-500"
                            >
                              View semester
                            </Link>
                          </div>
                          {offering.taAssignments && offering.taAssignments.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">Head TAs:</p>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {offering.taAssignments.map((assignment) => (
                                  <Link
                                    key={assignment.id}
                                    href={`/people/${assignment.user?.id}`}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
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
        </div>

        {/* All Head TAs */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Head TAs Worked With</h2>
            <p className="mt-1 text-sm text-gray-500">
              All head TAs who have worked with {professor.firstName} {professor.lastName}
            </p>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {Array.from(uniqueTAs.values())
                .sort((a, b) => a.lastName.localeCompare(b.lastName))
                .map((ta) => (
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