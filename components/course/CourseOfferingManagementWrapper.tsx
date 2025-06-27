'use client';

import { CourseOfferingManagement } from './CourseOfferingManagement';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface CourseOffering {
  id: string;
  courseId: string;
  courseNumber: string;
  courseName: string;
  semester: string;
  year: number;
  season: string;
  professor?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  taAssignments: Array<{
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
    hoursPerWeek: number;
  }>;
}

interface CourseOfferingManagementWrapperProps {
  courseId: string;
  courseNumber: string;
  courseName: string;
  offerings: CourseOffering[];
}

export function CourseOfferingManagementWrapper(props: CourseOfferingManagementWrapperProps) {
  const { isAdmin, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="mb-12 border-t border-charcoal/10 pt-12">
        <div className="text-center bg-charcoal/5 rounded-lg p-6">
          <p className="font-serif text-charcoal mb-4">Sign in to manage course offerings and TA assignments</p>
          <Link
            href="/auth/signin"
            className="font-serif text-sm uppercase tracking-wider text-charcoal border border-charcoal px-6 py-2 hover:opacity-70 transition-opacity duration-200 inline-block"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mb-12 border-t border-charcoal/10 pt-12">
        <div className="text-center bg-charcoal/5 rounded-lg p-6">
          <p className="font-serif text-charcoal">Only administrators can manage course offerings and TA assignments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12 border-t border-charcoal/10 pt-12">
      <h2 className="font-serif text-2xl text-charcoal mb-6">Manage Course Offerings</h2>
      <CourseOfferingManagement 
        {...props} 
        onUpdate={() => window.location.reload()} 
      />
    </div>
  );
}