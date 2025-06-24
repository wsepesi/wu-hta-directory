import { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import Link from "next/link";
import { courseRepository } from "@/lib/repositories/courses";
import { courseOfferingRepository } from "@/lib/repositories/course-offerings";
import { professorRepository } from "@/lib/repositories/professors";
import { taAssignmentRepository } from "@/lib/repositories/ta-assignments";
import { CourseManagement } from "@/components/course/CourseManagement";

export const metadata: Metadata = {
  title: "Manage Courses - WU Head TA Directory",
  description: "Manage courses and course offerings",
};

export default async function ManageCoursesPage() {
  await requireAuth();

  const courses = await courseRepository.findAll();
  const professors = await professorRepository.findAll();
  
  // Get course offerings with details
  const coursesWithOfferings = await Promise.all(
    courses.map(async (course) => {
      const offerings = await courseOfferingRepository.findByCourseId(course.id);
      const offeringsWithDetails = await Promise.all(
        offerings.map(async (offering) => {
          const taAssignments = await taAssignmentRepository.findByCourseOfferingId(offering.id);
          return {
            ...offering,
            taCount: taAssignments.length,
          };
        })
      );
      return {
        ...course,
        offerings: offeringsWithDetails,
      };
    })
  );

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

        <CourseManagement
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