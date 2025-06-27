import Link from 'next/link';
import { courseOfferingRepository } from "@/lib/repositories/course-offerings";
import { taAssignmentRepository } from "@/lib/repositories/hta-records";
import { invitationRepository } from "@/lib/repositories/invitations";

export async function DashboardQuickActions() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentSeason = currentMonth >= 7 ? "Fall" : "Spring";

  // Parallel data fetching for quick action stats
  const [allOfferings, currentAssignments, pendingInvitations] = await Promise.all([
    courseOfferingRepository.findAll(),
    taAssignmentRepository.findBySemester(`${currentSeason} ${currentYear}`),
    invitationRepository.findPending(),
  ]);

  const currentOfferings = allOfferings.filter(o => 
    o.year === currentYear && o.season === currentSeason
  );

  // Calculate missing TAs
  const offeringsWithoutTAs = currentOfferings.filter(offering => {
    const hasTA = currentAssignments.some(a => a.courseOfferingId === offering.id);
    return !hasTA;
  });

  return (
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
          <h3 className="font-serif text-lg text-charcoal mb-2">Unrecorded HTAs</h3>
          <p className="text-sm leading-relaxed text-charcoal/80">
            <span className="font-serif text-2xl text-charcoal">{offeringsWithoutTAs.length}</span>
            <br />courses without HTAs
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
            <span className="font-serif text-2xl text-charcoal">{pendingInvitations.length}</span>
            <br />pending invitations
          </p>
        </div>
      </Link>
    </div>
  );
}