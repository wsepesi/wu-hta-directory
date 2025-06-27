import Link from 'next/link';
import { Suspense } from 'react';
import { courseOfferingRepository } from "@/lib/repositories/course-offerings";
import { Skeleton } from '@/components/ui/Skeleton';
import type { CourseOfferingWithRelations } from '@/lib/types';

interface MissingTAWidgetProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
}

// Individual course card skeleton
function CourseCardSkeleton() {
  return (
    <div className="border-t border-charcoal/20 pt-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton variant="text" width="250px" height="24px" className="mb-2" />
          <Skeleton variant="text" width="300px" height="16px" className="mb-1" />
          <Skeleton variant="text" width="120px" height="16px" />
        </div>
        <div className="ml-6 flex flex-col space-y-2">
          <Skeleton variant="text" width="100px" height="16px" />
          <Skeleton variant="text" width="100px" height="16px" />
        </div>
      </div>
    </div>
  );
}

// Header component
async function MissingTAHeader({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <p className="font-serif text-lg text-charcoal">
        {count} courses without recorded HTAs
      </p>
      {count > 5 && (
        <Link
          href="/dashboard/missing-records"
          className="font-serif text-sm text-charcoal hover:opacity-70 transition-opacity duration-200"
          prefetch={true}
        >
          View all →
        </Link>
      )}
    </div>
  );
}

// Individual course card
async function MissingTACourseCard({ 
  offering, 
  isAuthenticated, 
  isAdmin 
}: { 
  offering: CourseOfferingWithRelations;
  isAuthenticated: boolean;
  isAdmin: boolean;
}) {
  const getDaysWaiting = (createdAt: Date | string) => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    return Math.floor((now - created) / (24 * 60 * 60 * 1000));
  };
  
  const days = getDaysWaiting(offering.createdAt);
  const courseUrl = `/courses/${offering.course?.courseNumber.replace(/\s+/g, '-')}`;
  
  return (
    <div className="border-t border-charcoal/20 pt-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-serif text-lg text-charcoal mb-2">
            {offering.course?.courseNumber}: {offering.course?.courseName}
          </h4>
          <p className="text-sm text-charcoal/80 mb-1">
            {offering.semester} • Professor: {
              offering.professor 
                ? `${offering.professor.firstName} ${offering.professor.lastName}`
                : 'Not assigned'
            }
          </p>
          <p className="font-serif text-sm italic text-charcoal/60">
            Unrecorded for {days} day{days !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="ml-6 flex flex-col space-y-2">
          <Link
            href={courseUrl}
            className="font-serif text-sm text-charcoal hover:opacity-70 transition-opacity duration-200"
            prefetch={true}
          >
            View Course →
          </Link>
          {isAuthenticated && isAdmin && (
            <Link
              href={`/auth/invite?courseOfferingId=${offering.id}`}
              className="font-serif text-sm text-charcoal hover:opacity-70 transition-opacity duration-200"
              prefetch={false}
            >
              Record Head TA →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Course list component
async function MissingTACourseList({ 
  offerings, 
  isAuthenticated, 
  isAdmin 
}: { 
  offerings: CourseOfferingWithRelations[];
  isAuthenticated: boolean;
  isAdmin: boolean;
}) {
  if (offerings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-serif text-lg text-charcoal/60">
          All courses have recorded HTAs!
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {offerings.map((offering) => (
        <Suspense key={offering.id} fallback={<CourseCardSkeleton />}>
          <MissingTACourseCard
            offering={offering}
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
          />
        </Suspense>
      ))}
    </div>
  );
}

export async function EnhancedMissingTAWidget({ isAuthenticated, isAdmin }: MissingTAWidgetProps) {
  // Fetch course offerings with relations
  const allOfferings = await courseOfferingRepository.findAllWithRelations();
  
  // Filter for offerings without TAs
  const missingTAs = allOfferings.filter(
    offering => !offering.taAssignments || offering.taAssignments.length === 0
  );
  
  const displayOfferings = missingTAs.slice(0, 5);
  
  return (
    <div className="bg-white">
      <Suspense fallback={
        <div className="flex items-center justify-between mb-6">
          <Skeleton variant="text" width="300px" height="24px" />
          <Skeleton variant="text" width="80px" height="16px" />
        </div>
      }>
        <MissingTAHeader count={missingTAs.length} />
      </Suspense>
      
      <Suspense fallback={
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      }>
        <MissingTACourseList
          offerings={displayOfferings}
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
        />
      </Suspense>
    </div>
  );
}