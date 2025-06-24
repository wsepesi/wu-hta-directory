import { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import Link from "next/link";
import { courseOfferingRepository } from "@/lib/repositories/course-offerings";
import { taAssignmentRepository } from "@/lib/repositories/ta-assignments";
import { invitationRepository } from "@/lib/repositories/invitations";
import { MissingTAWidget } from "@/components/dashboard/MissingTAWidget";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Dashboard - WU Head TA Directory",
  description: "Admin dashboard for managing courses and TAs",
};

export default async function DashboardPage() {
  const user = await requireAuth();
  
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-sm text-gray-600">
            This page is only accessible to administrators.
          </p>
          <Link href="/" className="mt-4 text-indigo-600 hover:text-indigo-500">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  // Get statistics
  const allOfferings = await courseOfferingRepository.findAll();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentSeason = currentMonth >= 7 ? "Fall" : "Spring";
  
  const currentOfferings = allOfferings.filter(o => 
    o.year === currentYear && o.season === currentSeason
  );
  
  const allTAAssignments = await taAssignmentRepository.findAll();
  const currentAssignments = await taAssignmentRepository.findBySemester(`${currentSeason} ${currentYear}`);
  
  const pendingInvitations = await invitationRepository.findPending();
  
  // Calculate missing TAs
  const offeringsWithoutTAs = currentOfferings.filter(offering => {
    const hasTA = currentAssignments.some(a => a.courseOfferingId === offering.id);
    return !hasTA;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back, {user.firstName}! Here's your overview.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Link href="/manage/courses">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Manage Courses</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Add courses, create offerings, and manage professors
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/missing-tas">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Missing TAs</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {offeringsWithoutTAs.length} courses need TAs
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/auth/invite">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Send Invitations</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Invite new Head TAs to join
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/manage/invitations">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Manage Invitations</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {pendingInvitations.length} pending invitations
                </p>
              </div>
            </Card>
          </Link>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Current Offerings
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {currentOfferings.length}
              </dd>
              <p className="mt-2 text-xs text-gray-500">
                {currentSeason} {currentYear}
              </p>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Active TAs
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {currentAssignments.length}
              </dd>
              <p className="mt-2 text-xs text-gray-500">
                This semester
              </p>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Missing TAs
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-red-600">
                {offeringsWithoutTAs.length}
              </dd>
              <p className="mt-2 text-xs text-gray-500">
                Need assignment
              </p>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Coverage Rate
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {currentOfferings.length > 0 
                  ? Math.round((currentOfferings.length - offeringsWithoutTAs.length) / currentOfferings.length * 100)
                  : 0}%
              </dd>
              <p className="mt-2 text-xs text-gray-500">
                Courses with TAs
              </p>
            </div>
          </div>
        </div>

        {/* Missing TAs Widget */}
        <div className="mb-8">
          <MissingTAWidget />
        </div>

        {/* Navigation Links */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Link href="/courses" className="text-sm text-indigo-600 hover:text-indigo-500">
            View All Courses →
          </Link>
          <Link href="/people" className="text-sm text-indigo-600 hover:text-indigo-500">
            View All People →
          </Link>
          <Link href="/professors" className="text-sm text-indigo-600 hover:text-indigo-500">
            View All Professors →
          </Link>
          <Link href="/semesters" className="text-sm text-indigo-600 hover:text-indigo-500">
            View by Semester →
          </Link>
        </div>
      </div>
    </div>
  );
}