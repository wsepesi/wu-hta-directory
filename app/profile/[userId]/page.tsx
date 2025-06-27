import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth-utils";
import Link from "next/link";
import { db } from "@/lib/db";
import { users, taAssignments, courseOfferings, courses, professors, userPrivacySettings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatUserName } from "@/lib/auth-utils";

interface PageProps {
  params: Promise<{
    userId: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const [userDetails] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (!userDetails) {
    return {
      title: "Profile Not Found - WU Head TA Directory",
    };
  }

  return {
    title: `${formatUserName(userDetails.firstName, userDetails.lastName)} - WU Head TA Directory`,
    description: `Profile of ${formatUserName(userDetails.firstName, userDetails.lastName)}`,
  };
}

export default async function PublicProfilePage({ params, searchParams }: PageProps) {
  const { userId } = await params;
  const currentUser = await getCurrentUser();
  const isOwnProfile = currentUser?.id === userId;
  
  // Check for success messages from progressive enhancement
  const search = await searchParams;
  const successMessage = search?.success as string | undefined;

  // Get user's full details
  const [userDetails] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userDetails) {
    notFound();
  }

  // Check for claimable profiles if viewing own profile
  let claimableProfilesCount = 0;
  if (isOwnProfile) {
    const { userRepository } = await import('@/lib/repositories/users');
    const claimableProfiles = await userRepository.findClaimableProfiles(userId);
    claimableProfilesCount = claimableProfiles.length;
  }

  // Get privacy settings
  const [privacySettings] = await db
    .select()
    .from(userPrivacySettings)
    .where(eq(userPrivacySettings.userId, userId))
    .limit(1);

  // Default privacy settings if none exist
  const privacy = privacySettings || {
    showEmail: false,
    showGradYear: true,
    showLocation: true,
    showLinkedIn: true,
    showPersonalSite: true,
    showCourses: true,
    appearInDirectory: true,
    allowContact: true,
  };

  // Get user's TA assignments with course details if allowed by privacy settings
  const assignments = privacy.showCourses ? await db
    .select({
      id: taAssignments.id,
      hoursPerWeek: taAssignments.hoursPerWeek,
      responsibilities: taAssignments.responsibilities,
      createdAt: taAssignments.createdAt,
      courseOffering: {
        id: courseOfferings.id,
        semester: courseOfferings.semester,
        year: courseOfferings.year,
        season: courseOfferings.season,
      },
      course: {
        id: courses.id,
        courseNumber: courses.courseNumber,
        courseName: courses.courseName,
      },
      professor: {
        id: professors.id,
        firstName: professors.firstName,
        lastName: professors.lastName,
      },
    })
    .from(taAssignments)
    .innerJoin(courseOfferings, eq(taAssignments.courseOfferingId, courseOfferings.id))
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .leftJoin(professors, eq(courseOfferings.professorId, professors.id))
    .where(eq(taAssignments.userId, userId))
    .orderBy(desc(courseOfferings.year), desc(courseOfferings.season)) : [];

  // Get inviter details if applicable and if viewing own profile or admin
  let inviter = null;
  if (userDetails.invitedBy && (isOwnProfile || currentUser?.role === "admin")) {
    [inviter] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userDetails.invitedBy))
      .limit(1);
  }

  // Group assignments by semester
  const assignmentsBySemester = assignments.reduce((acc, assignment) => {
    const key = assignment.courseOffering.semester;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(assignment);
    return acc;
  }, {} as Record<string, typeof assignments>);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success message from progressive enhancement */}
        {successMessage === 'password_changed' && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Password changed successfully
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Claimable profiles notification */}
        {isOwnProfile && claimableProfilesCount > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  You may have unclaimed profiles
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    We found {claimableProfilesCount} profile{claimableProfilesCount > 1 ? 's' : ''} that may belong to you.
                    Claiming these profiles will merge their course assignments with your current profile.
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href="/profile/claim"
                    className="text-sm font-medium text-blue-800 hover:text-blue-700"
                  >
                    Review and claim profiles →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Profile Header */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {formatUserName(userDetails.firstName, userDetails.lastName)}
              </h1>
              {(privacy.showEmail || isOwnProfile) && (
                <p className="mt-1 text-sm text-gray-500">{userDetails.email}</p>
              )}
              {userDetails.role === "admin" && (
                <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Administrator
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              {isOwnProfile ? (
                <>
                  <Link
                    href="/profile/edit"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Edit Profile
                  </Link>
                  <Link
                    href="/auth/change-password"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Change Password
                  </Link>
                </>
              ) : (
                !currentUser && (
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Sign in to edit your profile
                  </Link>
                )
              )}
            </div>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              {userDetails.gradYear && (privacy.showGradYear || isOwnProfile) && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Graduation Year</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userDetails.gradYear}</dd>
                </div>
              )}
              
              {userDetails.degreeProgram && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Degree Program</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userDetails.degreeProgram}</dd>
                </div>
              )}
              
              {userDetails.currentRole && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Current Role</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userDetails.currentRole}</dd>
                </div>
              )}
              
              {userDetails.location && (privacy.showLocation || isOwnProfile) && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userDetails.location}</dd>
                </div>
              )}
              
              {userDetails.linkedinUrl && (privacy.showLinkedIn || isOwnProfile) && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">LinkedIn</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a
                      href={userDetails.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      View Profile
                    </a>
                  </dd>
                </div>
              )}
              
              {userDetails.personalSite && (privacy.showPersonalSite || isOwnProfile) && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Personal Website</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a
                      href={userDetails.personalSite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      Visit Site
                    </a>
                  </dd>
                </div>
              )}
              
              {inviter && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Invited By</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <Link
                      href={`/profile/${inviter.id}`}
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      {formatUserName(inviter.firstName, inviter.lastName)}
                    </Link>
                  </dd>
                </div>
              )}
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(userDetails.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* TA Assignment History */}
        {privacy.showCourses || isOwnProfile ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">TA Assignment History</h2>
              <p className="mt-1 text-sm text-gray-500">
                {assignments.length} total assignment{assignments.length !== 1 ? "s" : ""}
              </p>
            </div>
            
            {assignments.length > 0 ? (
              <div className="border-t border-gray-200">
                {Object.entries(assignmentsBySemester).map(([semester, semesterAssignments]) => (
                  <div key={semester} className="px-4 py-5 sm:px-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">{semester}</h3>
                    <div className="space-y-3">
                      {semesterAssignments.map((assignment) => (
                        <div key={assignment.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                <Link
                                  href={`/courses/${assignment.course.courseNumber}`}
                                  className="hover:text-indigo-600"
                                >
                                  {assignment.course.courseNumber}: {assignment.course.courseName}
                                </Link>
                              </h4>
                              {assignment.professor && (
                                <p className="mt-1 text-sm text-gray-500">
                                  Professor{" "}
                                  <Link
                                    href={`/professors/${assignment.professor.id}`}
                                    className="text-indigo-600 hover:text-indigo-500"
                                  >
                                    {formatUserName(
                                      assignment.professor.firstName,
                                      assignment.professor.lastName
                                    )}
                                  </Link>
                                </p>
                              )}
                              {assignment.hoursPerWeek && (
                                <p className="mt-1 text-sm text-gray-500">
                                  {assignment.hoursPerWeek} hours/week
                                </p>
                              )}
                              {assignment.responsibilities && (
                                <p className="mt-2 text-sm text-gray-600">
                                  {assignment.responsibilities}
                                </p>
                              )}
                            </div>
                            <Link
                              href={`/semesters/${semester}`}
                              className="text-sm text-indigo-600 hover:text-indigo-500"
                            >
                              View semester
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                No TA assignments yet
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
              TA assignment history is private
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          {isOwnProfile ? (
            <>
              <Link
                href="/manage/invitations"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Manage Invitations
              </Link>
              <span className="text-gray-300">•</span>
            </>
          ) : null}
          <Link
            href="/directory"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            View Directory
          </Link>
          {isOwnProfile && userDetails.role === "admin" && (
            <>
              <span className="text-gray-300">•</span>
              <Link
                href="/admin"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Admin Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}