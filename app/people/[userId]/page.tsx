import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { userRepository } from "@/lib/repositories/users";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface PageProps {
  params: {
    userId: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await userRepository.findById(params.userId);
  
  if (!user) {
    return {
      title: "User Not Found",
    };
  }

  return {
    title: `${user.firstName} ${user.lastName} - WU Head TA Directory`,
    description: `Profile of ${user.firstName} ${user.lastName}`,
  };
}

export default async function PersonProfilePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const user = await userRepository.findWithRelations(params.userId);

  if (!user) {
    notFound();
  }

  const isOwnProfile = session?.user?.id === user.id;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/people"
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
            Back to directory
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h1>
                {user.currentRole && (
                  <p className="mt-1 text-sm text-gray-600">{user.currentRole}</p>
                )}
              </div>
              {isOwnProfile && (
                <Link
                  href="/profile/edit"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Edit Profile
                </Link>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a
                    href={`mailto:${user.email}`}
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    {user.email}
                  </a>
                </dd>
              </div>

              {user.gradYear && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Graduation Year</dt>
                  <dd className="mt-1 text-sm text-gray-900">Class of {user.gradYear}</dd>
                </div>
              )}

              {user.degreeProgram && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Degree Program</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.degreeProgram}</dd>
                </div>
              )}

              {user.location && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.location}</dd>
                </div>
              )}

              {user.linkedinUrl && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">LinkedIn</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a
                      href={user.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      View Profile
                    </a>
                  </dd>
                </div>
              )}

              {user.personalSite && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Personal Website</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a
                      href={user.personalSite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      Visit Site
                    </a>
                  </dd>
                </div>
              )}

              {user.inviter && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Invited by</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <Link
                      href={`/people/${user.inviter.id}`}
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      {user.inviter.firstName} {user.inviter.lastName}
                    </Link>
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-sm font-medium text-gray-500">Member since</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
            </dl>
          </div>

          {user.taAssignments && user.taAssignments.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">TA History</h2>
              <div className="space-y-4">
                {user.taAssignments.map((assignment) => (
                  <div key={assignment.id} className="border-l-4 border-indigo-200 pl-4">
                    <h3 className="text-sm font-medium text-gray-900">
                      <Link
                        href={`/courses/${assignment.courseOffering?.course?.courseNumber}`}
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        {assignment.courseOffering?.course?.courseNumber}:{" "}
                        {assignment.courseOffering?.course?.courseName}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-600">
                      {assignment.courseOffering?.season} {assignment.courseOffering?.year}
                      {assignment.courseOffering?.professor && (
                        <>
                          {" • Professor "}
                          <Link
                            href={`/professors/${assignment.courseOffering.professor.id}`}
                            className="text-indigo-600 hover:text-indigo-500"
                          >
                            {assignment.courseOffering.professor.firstName}{" "}
                            {assignment.courseOffering.professor.lastName}
                          </Link>
                        </>
                      )}
                    </p>
                    {assignment.hoursPerWeek && (
                      <p className="text-sm text-gray-500">
                        {assignment.hoursPerWeek} hours/week
                      </p>
                    )}
                    {assignment.responsibilities && (
                      <p className="mt-1 text-sm text-gray-600">
                        {assignment.responsibilities}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}