import Link from 'next/link';
import { Suspense } from 'react';
import { courseOfferingRepository } from "@/lib/repositories/course-offerings";
import { taAssignmentRepository } from "@/lib/repositories/hta-records";
import { invitationRepository } from "@/lib/repositories/invitations";
import { Skeleton } from '@/components/ui/Skeleton';

// Quick action card skeleton
function QuickActionSkeleton() {
  return (
    <div className="border-t border-charcoal pt-4">
      <Skeleton variant="text" width="150px" height="24px" className="mb-2" />
      <Skeleton variant="text" width="200px" height="16px" />
    </div>
  );
}

// Individual quick action components
async function ManageCoursesAction() {
  return (
    <Link href="/manage/courses" className="group" prefetch={true}>
      <div className="border-t border-charcoal pt-4 hover:opacity-70 transition-opacity duration-200">
        <h3 className="font-serif text-lg text-charcoal mb-2">Manage Courses</h3>
        <p className="text-sm leading-relaxed text-charcoal/80">
          Add courses, create offerings, and manage professors
        </p>
      </div>
    </Link>
  );
}

async function MissingTAsAction() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentSeason = currentMonth >= 7 ? "Fall" : "Spring";
  
  // Fetch data for missing TAs count
  const [allOfferings, currentAssignments] = await Promise.all([
    courseOfferingRepository.findAll(),
    taAssignmentRepository.findBySemester(`${currentSeason} ${currentYear}`),
  ]);
  
  const currentOfferings = allOfferings.filter(o => 
    o.year === currentYear && o.season === currentSeason
  );
  
  const offeringsWithoutTAs = currentOfferings.filter(offering => {
    const hasTA = currentAssignments.some(a => a.courseOfferingId === offering.id);
    return !hasTA;
  });
  
  return (
    <Link href="/dashboard/missing-records" className="group" prefetch={true}>
      <div className="border-t border-charcoal pt-4 hover:opacity-70 transition-opacity duration-200">
        <h3 className="font-serif text-lg text-charcoal mb-2">Unrecorded Head TAs</h3>
        <p className="text-sm leading-relaxed text-charcoal/80">
          <span className="font-serif text-2xl text-charcoal">{offeringsWithoutTAs.length}</span>
          <br />courses without Head TAs
        </p>
      </div>
    </Link>
  );
}

async function SendInvitationsAction() {
  return (
    <Link href="/auth/invite" className="group" prefetch={true}>
      <div className="border-t border-charcoal pt-4 hover:opacity-70 transition-opacity duration-200">
        <h3 className="font-serif text-lg text-charcoal mb-2">Send Invitations</h3>
        <p className="text-sm leading-relaxed text-charcoal/80">
          Record new Head TAs
        </p>
      </div>
    </Link>
  );
}

async function ManageInvitationsAction() {
  // Fetch pending invitations count
  const pendingInvitations = await invitationRepository.findPending();
  
  return (
    <Link href="/manage/invitations" className="group" prefetch={true}>
      <div className="border-t border-charcoal pt-4 hover:opacity-70 transition-opacity duration-200">
        <h3 className="font-serif text-lg text-charcoal mb-2">Manage Invitations</h3>
        <p className="text-sm leading-relaxed text-charcoal/80">
          <span className="font-serif text-2xl text-charcoal">{pendingInvitations.length}</span>
          <br />pending invitations
        </p>
      </div>
    </Link>
  );
}

export function EnhancedQuickActions() {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      <Suspense fallback={<QuickActionSkeleton />}>
        <ManageCoursesAction />
      </Suspense>
      
      <Suspense fallback={<QuickActionSkeleton />}>
        <MissingTAsAction />
      </Suspense>
      
      <Suspense fallback={<QuickActionSkeleton />}>
        <SendInvitationsAction />
      </Suspense>
      
      <Suspense fallback={<QuickActionSkeleton />}>
        <ManageInvitationsAction />
      </Suspense>
    </div>
  );
}