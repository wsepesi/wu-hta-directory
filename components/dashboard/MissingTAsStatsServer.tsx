import { courseOfferingRepository } from "@/lib/repositories/course-offerings";

export async function MissingTAsStatsServer() {
  // Get all course offerings without TAs
  const allOfferings = await courseOfferingRepository.findAllWithRelations();
  const missingTAOfferings = allOfferings.filter(
    offering => !offering.taAssignments || offering.taAssignments.length === 0
  );

  const totalMissing = missingTAOfferings.length;

  return (
    <div className="text-center mb-16">
      <p className="font-serif text-5xl text-charcoal mb-2">
        {totalMissing}
      </p>
      <p className="text-sm uppercase tracking-wider text-charcoal/60">
        Courses Without Recorded HTAs
      </p>
    </div>
  );
}