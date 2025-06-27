import { courseOfferingRepository } from "@/lib/repositories/course-offerings";
import { taAssignmentRepository } from "@/lib/repositories/hta-records";

export async function DashboardStatsServer() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentSeason = currentMonth >= 7 ? "Fall" : "Spring";
  const semester = `${currentSeason} ${currentYear}`;

  // Parallel data fetching for dashboard stats
  const [allOfferings, currentAssignments] = await Promise.all([
    courseOfferingRepository.findAll(),
    taAssignmentRepository.findBySemester(semester),
  ]);

  const currentOfferings = allOfferings.filter(o => 
    o.year === currentYear && o.season === currentSeason
  );

  // Calculate missing TAs
  const offeringsWithoutTAs = currentOfferings.filter(offering => {
    const hasTA = currentAssignments.some(a => a.courseOfferingId === offering.id);
    return !hasTA;
  });

  const coverageRate = currentOfferings.length > 0 
    ? Math.round((currentOfferings.length - offeringsWithoutTAs.length) / currentOfferings.length * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      <div className="text-center">
        <p className="font-serif text-5xl text-charcoal mb-2">
          {currentOfferings.length}
        </p>
        <p className="text-sm uppercase tracking-wider text-charcoal/60">
          Current Offerings
        </p>
        <p className="font-serif text-sm text-charcoal/80 mt-1">
          {currentSeason} {currentYear}
        </p>
      </div>

      <div className="text-center">
        <p className="font-serif text-5xl text-charcoal mb-2">
          {currentAssignments.length}
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
          {offeringsWithoutTAs.length}
        </p>
        <p className="text-sm uppercase tracking-wider text-charcoal/60">
          Without HTAs
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
          Courses with HTAs
        </p>
      </div>
    </div>
  );
}