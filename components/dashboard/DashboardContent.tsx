'use client';

import Link from 'next/link';
import { MissingTAWidget } from '@/components/dashboard/MissingTAWidget';

interface DashboardStats {
  currentOfferings: number;
  currentAssignments: number;
  offeringsWithoutTAs: number;
  pendingInvitations: number;
  currentSeason: string;
  currentYear: number;
  userName?: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export function DashboardContent({ stats }: { stats: DashboardStats }) {
  const { isAuthenticated, isAdmin } = stats;
  const coverageRate = stats.currentOfferings > 0 
    ? Math.round((stats.currentOfferings - stats.offeringsWithoutTAs) / stats.currentOfferings * 100)
    : 0;

  return (
    <>
      {/* Quick Actions - Only for authenticated admins */}
      {isAuthenticated && isAdmin && (
        <section className="mb-16">
          <h2 className="font-serif text-2xl text-charcoal mb-8">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/manage/courses" className="group">
              <div className="border-t border-charcoal pt-4 hover:opacity-70 transition-opacity duration-200">
                <h3 className="font-serif text-lg text-charcoal mb-2">Manage Courses</h3>
                <p className="text-sm leading-relaxed text-charcoal/80">
                  Add courses, create offerings, and manage professors
                </p>
              </div>
            </Link>

            <Link href="/dashboard/missing-records" className="group">
              <div className="border-t border-charcoal pt-4 hover:opacity-70 transition-opacity duration-200">
                <h3 className="font-serif text-lg text-charcoal mb-2">Unrecorded Head TAs</h3>
                <p className="text-sm leading-relaxed text-charcoal/80">
                  <span className="font-serif text-2xl text-charcoal">{stats.offeringsWithoutTAs}</span>
                  <br />courses without Head TAs
                </p>
              </div>
            </Link>

            <Link href="/auth/invite" className="group">
              <div className="border-t border-charcoal pt-4 hover:opacity-70 transition-opacity duration-200">
                <h3 className="font-serif text-lg text-charcoal mb-2">Send Invitations</h3>
                <p className="text-sm leading-relaxed text-charcoal/80">
                  Record new Head TAs
                </p>
              </div>
            </Link>

            <Link href="/manage/invitations" className="group">
              <div className="border-t border-charcoal pt-4 hover:opacity-70 transition-opacity duration-200">
                <h3 className="font-serif text-lg text-charcoal mb-2">Manage Invitations</h3>
                <p className="text-sm leading-relaxed text-charcoal/80">
                  <span className="font-serif text-2xl text-charcoal">{stats.pendingInvitations}</span>
                  <br />pending invitations
                </p>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Sign in prompt for unauthenticated users */}
      {!isAuthenticated && (
        <section className="mb-16">
          <div className="border-t border-charcoal pt-8">
            <p className="font-serif text-lg text-charcoal mb-4">
              Want to manage courses and TAs?
            </p>
            <Link 
              href="/auth/signin" 
              className="inline-block font-serif text-sm uppercase tracking-wider text-charcoal border border-charcoal px-6 py-3 hover:bg-charcoal hover:text-white transition-colors duration-200"
            >
              Sign in to manage
            </Link>
          </div>
        </section>
      )}

      {/* Statistics Overview - Available to all users */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl text-charcoal mb-8">Current Statistics</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <p className="font-serif text-5xl text-charcoal mb-2">
              {stats.currentOfferings}
            </p>
            <p className="text-sm uppercase tracking-wider text-charcoal/60">
              Current Offerings
            </p>
            <p className="font-serif text-sm text-charcoal/80 mt-1">
              {stats.currentSeason} {stats.currentYear}
            </p>
          </div>

          <div className="text-center">
            <p className="font-serif text-5xl text-charcoal mb-2">
              {stats.currentAssignments}
            </p>
            <p className="text-sm uppercase tracking-wider text-charcoal/60">
              Active TAs
            </p>
            <p className="font-serif text-sm text-charcoal/80 mt-1">
              This semester
            </p>
          </div>

          <div className="text-center">
            <p className="font-serif text-5xl text-red-800 mb-2">
              {stats.offeringsWithoutTAs}
            </p>
            <p className="text-sm uppercase tracking-wider text-charcoal/60">
              Without Head TAs
            </p>
            <p className="font-serif text-sm text-charcoal/80 mt-1">
              Need recording
            </p>
          </div>

          <div className="text-center">
            <p className="font-serif text-5xl text-charcoal mb-2">
              {coverageRate}%
            </p>
            <p className="text-sm uppercase tracking-wider text-charcoal/60">
              Coverage Rate
            </p>
            <p className="font-serif text-sm text-charcoal/80 mt-1">
              Courses with Head TAs
            </p>
          </div>
        </div>
      </section>

      {/* Missing TAs Widget - Available to all users */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-2xl text-charcoal">Courses Without Recorded Head TAs</h2>
          {!isAuthenticated && (
            <p className="font-serif text-sm italic text-charcoal/60">
              Sign in to record Head TAs
            </p>
          )}
        </div>
        <MissingTAWidget />
      </section>

      {/* Navigation Links - Available to all users */}
      <section>
        <h2 className="font-serif text-2xl text-charcoal mb-8">Browse</h2>
        <nav className="space-y-4">
          <Link href="/courses" className="block font-serif text-lg text-charcoal hover:opacity-70 transition-opacity duration-200">
            View All Courses →
          </Link>
          <Link href="/people" className="block font-serif text-lg text-charcoal hover:opacity-70 transition-opacity duration-200">
            View All People →
          </Link>
          <Link href="/professors" className="block font-serif text-lg text-charcoal hover:opacity-70 transition-opacity duration-200">
            View All Professors →
          </Link>
          <Link href="/semesters" className="block font-serif text-lg text-charcoal hover:opacity-70 transition-opacity duration-200">
            View by Semester →
          </Link>
        </nav>
      </section>
    </>
  );
}