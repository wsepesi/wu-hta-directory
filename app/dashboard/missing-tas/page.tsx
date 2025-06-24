import { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import Link from "next/link";
import { courseOfferingRepository } from "@/lib/repositories/course-offerings";
import { MissingTAWidget } from "@/components/dashboard/MissingTAWidget";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Missing TAs Dashboard - WU Head TA Directory",
  description: "Manage courses that need head TAs",
};

export default async function MissingTAsDashboard() {
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

  // Get all course offerings without TAs
  const allOfferings = await courseOfferingRepository.findAllWithRelations();
  const missingTAOfferings = allOfferings.filter(
    offering => !offering.taAssignments || offering.taAssignments.length === 0
  );

  // Calculate statistics
  const totalMissing = missingTAOfferings.length;
  const urgentCount = missingTAOfferings.filter(o => {
    const days = Math.floor(
      (Date.now() - new Date(o.createdAt).getTime()) / (24 * 60 * 60 * 1000)
    );
    return days > 14;
  }).length;
  const highPriorityCount = missingTAOfferings.filter(o => {
    const days = Math.floor(
      (Date.now() - new Date(o.createdAt).getTime()) / (24 * 60 * 60 * 1000)
    );
    return days > 7 && days <= 14;
  }).length;

  // Group by semester
  const bySemester = missingTAOfferings.reduce((acc, offering) => {
    if (!acc[offering.semester]) {
      acc[offering.semester] = [];
    }
    acc[offering.semester].push(offering);
    return acc;
  }, {} as Record<string, typeof missingTAOfferings>);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">
                Missing TAs Dashboard
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage courses that need head TA assignments
              </p>
            </div>
            <Link href="/auth/invite">
              <Button>Send Invitations</Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Missing
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {totalMissing}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Urgent (&gt;14 days)
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-red-600">
                {urgentCount}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                High Priority (7-14 days)
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-yellow-600">
                {highPriorityCount}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                New (&lt;7 days)
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {totalMissing - urgentCount - highPriorityCount}
              </dd>
            </div>
          </div>
        </div>

        {/* Missing TAs by Semester */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">By Semester</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {Object.entries(bySemester)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([semester, offerings]) => (
                <div key={semester} className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4">
                    {semester} ({offerings.length} courses)
                  </h3>
                  <div className="space-y-3">
                    {offerings.map(offering => {
                      const days = Math.floor(
                        (Date.now() - new Date(offering.createdAt).getTime()) / (24 * 60 * 60 * 1000)
                      );
                      return (
                        <div key={offering.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {offering.course?.courseNumber}: {offering.course?.courseName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {offering.professor 
                                ? `Prof. ${offering.professor.firstName} ${offering.professor.lastName}`
                                : 'No professor assigned'} • {days} days waiting
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Link
                              href={`/courses/${offering.course?.courseNumber.replace(/\s+/g, '-')}`}
                              className="text-xs text-indigo-600 hover:text-indigo-500"
                            >
                              View
                            </Link>
                            <Link
                              href={`/auth/invite?courseOfferingId=${offering.id}`}
                              className="text-xs text-green-600 hover:text-green-500"
                            >
                              Invite
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Full List Widget */}
        <MissingTAWidget initialOfferings={missingTAOfferings} showAll />

        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Back to main dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}