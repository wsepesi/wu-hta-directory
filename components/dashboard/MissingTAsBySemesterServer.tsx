import Link from 'next/link';
import { courseOfferingRepository } from "@/lib/repositories/course-offerings";
import type { CourseOfferingWithRelations } from '@/lib/types';

interface MissingTAsBySemesterServerProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export async function MissingTAsBySemesterServer({ isAuthenticated, isAdmin }: MissingTAsBySemesterServerProps) {
  // Get all course offerings without TAs
  const allOfferings = await courseOfferingRepository.findAllWithRelations();
  const missingTAOfferings = allOfferings.filter(
    offering => !offering.taAssignments || offering.taAssignments.length === 0
  );

  // Group by semester
  const bySemester = missingTAOfferings.reduce((acc, offering) => {
    if (!acc[offering.semester]) {
      acc[offering.semester] = [];
    }
    acc[offering.semester].push(offering);
    return acc;
  }, {} as Record<string, CourseOfferingWithRelations[]>);

  const getDaysWaiting = (createdAt: Date | string) => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    return Math.floor((now - created) / (24 * 60 * 60 * 1000));
  };

  return (
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
                const days = getDaysWaiting(offering.createdAt);
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
                        href={`/courses/${offering.course?.courseNumber}`}
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
  );
}