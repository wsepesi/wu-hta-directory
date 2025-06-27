'use client';

import { CourseManagement } from './CourseManagement';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import type { Course, Professor } from '@/lib/types';

interface CourseOffering {
  id: string;
  semester: string;
  year: number;
  season: string;
  taCount: number;
}

interface CourseWithOfferings {
  id: string;
  courseNumber: string;
  courseName: string;
  offerings: CourseOffering[];
}

interface CourseManagementWrapperProps {
  initialCourses: Course[];
  initialProfessors: Professor[];
  coursesWithOfferings: CourseWithOfferings[];
  semesters: { value: string; label: string }[];
}

export function CourseManagementWrapper(props: CourseManagementWrapperProps) {
  const { isAdmin, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="space-y-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Sign in to Manage Courses
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                You need to be signed in as an administrator to manage courses, professors, and course offerings.
              </p>
              <Link
                href="/auth/signin"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Administrator Access Required
              </h2>
              <p className="text-sm text-gray-600">
                Only administrators can manage courses, professors, and course offerings.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <CourseManagement {...props} />;
}