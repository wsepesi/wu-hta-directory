import { courseOfferingRepository } from "@/lib/repositories/course-offerings";
import { taAssignmentRepository } from "@/lib/repositories/hta-records";
import { StreamingStatsCard } from './StreamingStatsCard';

// Individual stat fetchers for parallel loading
async function getCurrentOfferings() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentSeason = currentMonth >= 7 ? "Fall" : "Spring";
  
  const allOfferings = await courseOfferingRepository.findAll();
  return allOfferings.filter(o => 
    o.year === currentYear && o.season === currentSeason
  );
}

async function getCurrentAssignments() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentSeason = currentMonth >= 7 ? "Fall" : "Spring";
  const semester = `${currentSeason} ${currentYear}`;
  
  return taAssignmentRepository.findBySemester(semester);
}

async function getStatsData() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentSeason = currentMonth >= 7 ? "Fall" : "Spring";
  
  // Parallel data fetching
  const [currentOfferings, currentAssignments] = await Promise.all([
    getCurrentOfferings(),
    getCurrentAssignments(),
  ]);
  
  // Calculate missing TAs
  const offeringsWithoutTAs = currentOfferings.filter(offering => {
    const hasTA = currentAssignments.some(a => a.courseOfferingId === offering.id);
    return !hasTA;
  });
  
  const coverageRate = currentOfferings.length > 0 
    ? Math.round((currentOfferings.length - offeringsWithoutTAs.length) / currentOfferings.length * 100)
    : 0;
  
  return {
    currentOfferings: currentOfferings.length,
    currentAssignments: currentAssignments.length,
    missingTAs: offeringsWithoutTAs.length,
    coverageRate,
    semester: `${currentSeason} ${currentYear}`,
  };
}

export async function EnhancedDashboardStats() {
  const stats = await getStatsData();
  
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <StreamingStatsCard
        value={stats.currentOfferings}
        label="Current Offerings"
        sublabel={stats.semester}
        className="text-charcoal"
      />
      
      <StreamingStatsCard
        value={stats.currentAssignments}
        label="Active TAs"
        sublabel="This semester"
        className="text-charcoal"
      />
      
      <StreamingStatsCard
        value={stats.missingTAs}
        label="Without HTAs"
        sublabel="Need recording"
        className="text-red-800"
      />
      
      <StreamingStatsCard
        value={`${stats.coverageRate}%`}
        label="Coverage Rate"
        sublabel="Courses with HTAs"
        className="text-charcoal"
      />
    </div>
  );
}