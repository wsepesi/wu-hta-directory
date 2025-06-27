import Link from 'next/link';
import { courseOfferingRepository } from "@/lib/repositories/course-offerings";

interface MissingTAWidgetServerProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export async function MissingTAWidgetServer({ isAuthenticated, isAdmin }: MissingTAWidgetServerProps) {
  // Fetch course offerings with relations
  const allOfferings = await courseOfferingRepository.findAllWithRelations();
  
  // Filter for offerings without TAs
  const missingTAs = allOfferings.filter(
    offering => !offering.taAssignments || offering.taAssignments.length === 0
  );

  const displayOfferings = missingTAs.slice(0, 5);

  const getDaysWaiting = (createdAt: Date | string) => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    return Math.floor((now - created) / (24 * 60 * 60 * 1000));
  };

  return (
    <div className="bg-white">
      <div className="">
        <div className="flex items-center justify-between mb-6">
          <p className="font-serif text-lg text-charcoal">
            {missingTAs.length} courses need head TAs assigned
          </p>
          {missingTAs.length > 5 && (
            <Link
              href="/dashboard/missing-records"
              className="font-serif text-sm text-charcoal hover:opacity-70 transition-opacity duration-200"
            >
              View all →
            </Link>
          )}
        </div>

        {displayOfferings.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-serif text-lg text-charcoal/60">
              All courses have TAs assigned!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayOfferings.map((offering) => {
              const days = getDaysWaiting(offering.createdAt);
              return (
                <div
                  key={offering.id}
                  className="border-t border-charcoal/20 pt-6"
                >
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
                        Waiting for {days} day{days !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="ml-6 flex flex-col space-y-2">
                      <Link
                        href={`/courses/${offering.course?.courseNumber.replace(/\s+/g, '-')}`}
                        className="font-serif text-sm text-charcoal hover:opacity-70 transition-opacity duration-200"
                      >
                        View Course →
                      </Link>
                      {isAuthenticated && isAdmin && (
                        <Link
                          href={`/auth/invite?courseOfferingId=${offering.id}`}
                          className="font-serif text-sm text-charcoal hover:opacity-70 transition-opacity duration-200"
                        >
                          Invite TA →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}