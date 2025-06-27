import { Metadata } from "next";
import Link from "next/link";
import { courseRepository } from "@/lib/repositories/courses";
import { professorRepository } from "@/lib/repositories/professors";
import { CourseManagementWrapper } from "@/components/course/CourseManagementWrapper";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Manage Courses - WU Head TA Directory",
  description: "Manage courses and course offerings",
};

export default async function ManageCoursesPage() {
  // Remove requireAuth to allow public access to the page
  // The CourseManagementWrapper will handle auth checks

  // Fetch data in parallel to improve performance
  const [courses, professors, coursesWithOfferings] = await Promise.all([
    courseRepository.findAll(),
    professorRepository.findAll(),
    courseRepository.findAllWithOfferingsAndTACounts()
  ]);

  // Get current and upcoming semesters
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentSeason = currentMonth >= 7 ? "Fall" : "Spring";
  
  const semesters = [
    { 
      value: `${currentSeason} ${currentYear}`, 
      label: `${currentSeason} ${currentYear} (Current)` 
    },
    { 
      value: currentSeason === "Fall" ? `Spring ${currentYear + 1}` : `Fall ${currentYear}`, 
      label: currentSeason === "Fall" ? `Spring ${currentYear + 1}` : `Fall ${currentYear}` 
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Manage Courses
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Add new courses and create course offerings
          </p>
        </div>

        <CourseManagementWrapper
          initialCourses={courses}
          initialProfessors={professors}
          coursesWithOfferings={coursesWithOfferings}
          semesters={semesters}
        />

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