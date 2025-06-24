import { Metadata } from "next";
import { requireAuth, formatUserName } from "@/lib/auth-utils";
import Link from "next/link";
import { db } from "@/lib/db";
import { users, taAssignments, courseOfferings, courses, professors } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const metadata: Metadata = {
  title: "My Profile - WU Head TA Directory",
  description: "View and manage your profile",
};

export default async function ProfilePage() {
  const currentUser = await requireAuth();

  // Get user's full details
  const [userDetails] = await db
    .select()
    .from(users)
    .where(eq(users.id, currentUser.id))
    .limit(1);

  // Get user's TA assignments with course details
  const assignments = await db
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
    .where(eq(taAssignments.userId, currentUser.id))
    .orderBy(desc(courseOfferings.year), desc(courseOfferings.season));

  // Get inviter details if applicable
  let inviter = null;
  if (userDetails.invitedBy) {
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
        {/* Profile Header */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {formatUserName(userDetails.firstName, userDetails.lastName)}
              </h1>
              <p className="mt-1 text-sm text-gray-500">{userDetails.email}</p>
              {userDetails.role === "admin" && (
                <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Administrator
                </span>
              )}
            </div>
            <div className="flex space-x-3">
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
            </div>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              {userDetails.gradYear && (
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
              
              {userDetails.location && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userDetails.location}</dd>
                </div>
              )}
              
              {userDetails.linkedinUrl && (
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
              
              {userDetails.personalSite && (
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
                      href={`/people/${inviter.id}`}
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

        {/* Quick Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href="/manage/invitations"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Manage Invitations
          </Link>
          <span className="text-gray-300">•</span>
          <Link
            href="/directory"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            View Directory
          </Link>
          {userDetails.role === "admin" && (
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