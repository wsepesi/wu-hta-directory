import { Metadata } from "next";
import Link from "next/link";
import { professorRepository } from "@/lib/repositories/professors";
import { courseOfferingRepository } from "@/lib/repositories/course-offerings";
import CleanLayout, { CleanPageHeader } from "@/components/layout/CleanLayout";
import type { CourseOfferingWithRelations } from "@/lib/types";
import { ProgressiveProfessorFilters } from "@/components/professor/ProgressiveProfessorFilters";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Professors - WU Head TA Directory",
  description: "Browse professors who work with head TAs",
};

interface SearchParams {
  searchParams?: Promise<{
    search?: string;
  }>;
}

export default async function ProfessorsPage({ searchParams }: SearchParams) {
  const resolvedSearchParams = await searchParams;
  // Get professors based on search
  let professors;
  if (resolvedSearchParams?.search) {
    professors = await professorRepository.search(resolvedSearchParams.search);
  } else {
    professors = await professorRepository.findAll();
  }

  // Get statistics for each professor
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentSeason = currentMonth >= 8 ? "Fall" : "Spring";

  // Get all offerings for all professors in one query
  const professorIds = professors.map(p => p.id);
  const allOfferings = professorIds.length > 0 
    ? await courseOfferingRepository.findWithRelationsByProfessorIds(professorIds)
    : [];
  
  // Group offerings by professor
  const offeringsByProfessor = new Map<string, CourseOfferingWithRelations[]>();
  for (const offering of allOfferings) {
    if (offering.professorId) {
      if (!offeringsByProfessor.has(offering.professorId)) {
        offeringsByProfessor.set(offering.professorId, []);
      }
      offeringsByProfessor.get(offering.professorId)!.push(offering);
    }
  }

  const professorsWithStats = professors.map((professor) => {
    const offerings = offeringsByProfessor.get(professor.id) || [];
    const uniqueCourses = new Set(offerings.map((o: CourseOfferingWithRelations) => o.courseId));
    
    // Get current courses
    const currentOfferings = offerings.filter((o: CourseOfferingWithRelations) => 
      o.year === currentYear && o.season === currentSeason
    );
    
    const recentOfferings = offerings.slice(0, 3);

    // Map offerings to Course interface expected by ProfessorCard
    const mappedCourses = currentOfferings.map((offering: CourseOfferingWithRelations) => ({
      id: offering.course?.id || offering.courseId,
      code: offering.course?.courseNumber || '',
      name: offering.course?.courseName || '',
      semester: offering.semester,
      currentTAs: offering.taAssignments?.length || 0,
      requiredTAs: 1 // Default value, should be configured per course
    }));

    return {
      id: professor.id,
      name: `${professor.firstName} ${professor.lastName}`,
      email: professor.email,
      department: undefined, // TODO: Add department to professor schema
      office: undefined, // TODO: Add office to professor schema
      phone: undefined, // TODO: Add phone to professor schema
      imageUrl: undefined, // TODO: Add imageUrl to professor schema
      bio: undefined, // TODO: Add bio to professor schema
      courses: mappedCourses,
      courseCount: uniqueCourses.size,
      offeringCount: offerings.length,
      currentOfferings,
      recentOfferings,
    };
  });

  return (
    <CleanLayout maxWidth="7xl">
      <CleanPageHeader
        title="Professor Directory"
        description="Professors who work with head TAs"
        className="text-center mb-12"
      />

      {/* Search */}
      <ProgressiveProfessorFilters searchParams={resolvedSearchParams} />

      {/* Results Grid */}
      <section className="mb-16">
        <div className="grid grid-cols-1 gap-12">
          {professorsWithStats.map((professor) => (
            <div key={professor.id} className="border-t border-charcoal/20 pt-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-serif text-2xl text-charcoal mb-2">
                    <Link 
                      href={`/professors/${professor.id}`}
                      className="hover:opacity-70 transition-opacity duration-200"
                    >
                      {professor.name}
                    </Link>
                  </h2>
                  <p className="text-sm text-charcoal/60">
                    <a 
                      href={`mailto:${professor.email}`}
                      className="hover:opacity-70 transition-opacity duration-200"
                    >
                      {professor.email}
                    </a>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-3xl text-charcoal">{professor.courseCount}</p>
                  <p className="text-xs uppercase tracking-wider text-charcoal/60">Unique Courses</p>
                </div>
              </div>
              
              {professor.currentOfferings.length > 0 && (
                <div className="mb-4">
                  <p className="font-serif text-sm uppercase tracking-wider text-charcoal/60 mb-2">
                    Currently Teaching
                  </p>
                  <div className="space-y-1">
                    {professor.currentOfferings.map((offering: CourseOfferingWithRelations) => (
                      <p key={offering.id} className="font-serif text-base text-charcoal">
                        <Link 
                          href={`/courses/${offering.course?.courseNumber}`}
                          className="hover:opacity-70 transition-opacity duration-200"
                        >
                          {offering.course?.courseNumber}: {offering.course?.courseName}
                        </Link>
                        {offering.taAssignments && offering.taAssignments.length === 0 && (
                          <span className="ml-2 text-sm text-red-800">(No Head TA Recorded)</span>
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-8">
                <div>
                  <p className="font-serif text-lg text-charcoal">{professor.offeringCount}</p>
                  <p className="text-xs uppercase tracking-wider text-charcoal/60">Total Offerings</p>
                </div>
                <div>
                  <p className="font-serif text-lg text-charcoal">{professor.courses.filter((c) => c.currentTAs < c.requiredTAs).length}</p>
                  <p className="text-xs uppercase tracking-wider text-charcoal/60">Need TAs</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {professorsWithStats.length === 0 && (
        <div className="text-center py-16">
          <p className="font-serif text-lg text-charcoal/60">
            {resolvedSearchParams?.search
              ? "No professors found matching your search."
              : "No professors found."}
          </p>
        </div>
      )}

      <div className="mt-16 text-center">
        <Link
          href="/"
          className="font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
        >
          Back to home
        </Link>
      </div>
    </CleanLayout>
  );
}