import { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import Link from "next/link";
import { courseRepository } from "@/lib/repositories/courses";
import { courseOfferingRepository } from "@/lib/repositories/course-offerings";
import { SemesterPlanning } from "@/components/semester/SemesterPlanning";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Semester Planning - WU Head TA Directory",
  description: "Plan course offerings for upcoming semesters",
};

export default async function SemesterPlanningPage() {
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

  const courses = await courseRepository.findAll();
  
  // Get current and next few semesters
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentSeason = currentMonth >= 7 ? "Fall" : "Spring";
  
  const semesters = [
    {
      semester: `${currentSeason} ${currentYear}`,
      year: currentYear,
      season: currentSeason as 'Fall' | 'Spring',
      label: 'Current Semester',
    },
    {
      semester: currentSeason === "Fall" ? `Spring ${currentYear + 1}` : `Fall ${currentYear}`,
      year: currentSeason === "Fall" ? currentYear + 1 : currentYear,
      season: (currentSeason === "Fall" ? "Spring" : "Fall") as 'Fall' | 'Spring',
      label: 'Next Semester',
    },
    {
      semester: currentSeason === "Fall" ? `Fall ${currentYear + 1}` : `Spring ${currentYear + 1}`,
      year: currentYear + 1,
      season: currentSeason as 'Fall' | 'Spring',
      label: 'Two Semesters Out',
    },
  ];

  // Get offerings for each semester
  const semesterOfferings = await Promise.all(
    semesters.map(async (sem) => {
      const offerings = await courseOfferingRepository.findByYearAndSeason(sem.year, sem.season);
      return {
        ...sem,
        offerings,
      };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">
                Semester Planning
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Plan course offerings for upcoming semesters based on offering patterns
              </p>
            </div>
            <Link href="/manage/courses">
              <Button variant="secondary">
                Manage Courses
              </Button>
            </Link>
          </div>
        </div>

        {/* Planning Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          {semesterOfferings.map((sem) => (
            <div key={sem.semester} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {sem.label}
                </dt>
                <dd className="mt-1">
                  <div className="text-2xl font-semibold text-gray-900">
                    {sem.offerings.length} courses
                  </div>
                  <p className="text-sm text-gray-500">{sem.semester}</p>
                </dd>
              </div>
            </div>
          ))}
        </div>

        {/* Semester Planning Sections */}
        <div className="space-y-8">
          {semesterOfferings.map((sem, index) => (
            <div key={sem.semester}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {sem.label}: {sem.semester}
              </h2>
              <SemesterPlanning
                courses={courses}
                currentOfferings={sem.offerings}
                targetSemester={sem.semester}
                targetYear={sem.year}
                targetSeason={sem.season}
              />
              {index < semesterOfferings.length - 1 && (
                <div className="mt-8 border-b border-gray-200" />
              )}
            </div>
          ))}
        </div>

        {/* Course Pattern Summary */}
        <div className="mt-12 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Course Offering Patterns
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Fall & Spring</p>
              <p className="text-2xl font-semibold text-gray-900">
                {courses.filter(c => c.offeringPattern === 'both').length}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Fall Only</p>
              <p className="text-2xl font-semibold text-gray-900">
                {courses.filter(c => c.offeringPattern === 'fall_only').length}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Spring Only</p>
              <p className="text-2xl font-semibold text-gray-900">
                {courses.filter(c => c.offeringPattern === 'spring_only').length}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Occasional</p>
              <p className="text-2xl font-semibold text-gray-900">
                {courses.filter(c => c.offeringPattern === 'sparse').length}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}