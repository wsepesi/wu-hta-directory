'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { MissingTAWidget } from '@/components/dashboard/MissingTAWidget';
import type { CourseOfferingWithRelations } from '@/lib/types';

interface MissingTAsContentProps {
  missingTAOfferings: CourseOfferingWithRelations[];
  totalMissing: number;
  bySemester: Record<string, CourseOfferingWithRelations[]>;
}

export function MissingTAsContent({
  missingTAOfferings,
  totalMissing,
  bySemester,
}: MissingTAsContentProps) {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <>
      {/* Statistics Cards */}
      <div className="text-center mb-16">
        <p className="font-serif text-5xl text-charcoal mb-2">
          {totalMissing}
        </p>
        <p className="text-sm uppercase tracking-wider text-charcoal/60">
          Courses Without Recorded Head TAs
        </p>
      </div>

      {/* Sign in prompt for unauthenticated users */}
      {!isAuthenticated && (
        <section className="mb-16">
          <div className="border-t border-charcoal pt-8 text-center">
            <p className="font-serif text-lg text-charcoal mb-4">
              Know who taught these courses?
            </p>
            <Link 
              href="/auth/signin" 
              className="inline-block font-serif text-sm uppercase tracking-wider text-charcoal border border-charcoal px-6 py-3 hover:bg-charcoal hover:text-white transition-colors duration-200"
            >
              Sign in to record Head TAs
            </Link>
          </div>
        </section>
      )}

      {/* Missing Head TAs by Semester */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl text-charcoal mb-8">By Semester</h2>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {Object.entries(bySemester)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([semester, offerings]) => (
              <div key={semester} className="border-t border-charcoal pt-6">
                <h3 className="font-serif text-lg text-charcoal mb-6">
                  {semester} ({offerings.length} courses)
                </h3>
                <div className="space-y-4">
                  {offerings.map(offering => {
                    const days = Math.floor(
                      (Date.now() - new Date(offering.createdAt).getTime()) / (24 * 60 * 60 * 1000)
                    );
                    return (
                      <div key={offering.id} className="flex items-start justify-between pb-4 border-b border-charcoal/10 last:border-0">
                        <div className="flex-1">
                          <p className="font-serif text-base text-charcoal">
                            {offering.course?.courseNumber}: {offering.course?.courseName}
                          </p>
                          <p className="text-sm text-charcoal/60 mt-1">
                            {offering.professor 
                              ? `Professor ${offering.professor.firstName} ${offering.professor.lastName}`
                              : 'No professor assigned'} • {days} days unrecorded
                          </p>
                        </div>
                        <div className="ml-4 flex flex-col space-y-1">
                          <Link
                            href={`/courses/${offering.course?.courseNumber.replace(/\s+/g, '-')}`}
                            className="font-serif text-sm text-charcoal hover:opacity-70 transition-opacity duration-200"
                          >
                            View →
                          </Link>
                          {isAuthenticated && isAdmin && (
                            <Link
                              href={`/auth/invite?courseOfferingId=${offering.id}`}
                              className="font-serif text-sm text-charcoal hover:opacity-70 transition-opacity duration-200"
                            >
                              Record Head TA →
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Full List Widget */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl text-charcoal mb-8">All Courses Without Recorded Head TAs</h2>
        <MissingTAWidget initialOfferings={missingTAOfferings} showAll />
      </section>

      <div className="text-center">
        <Link
          href="/dashboard"
          className="font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
        >
          ← Back to dashboard
        </Link>
      </div>
    </>
  );
}