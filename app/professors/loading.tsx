import CleanLayout, { CleanPageHeader } from "@/components/layout/CleanLayout";
import { ProfessorPageSkeleton } from "@/components/professor/ProfessorSkeleton";

export default function ProfessorsLoading() {
  return (
    <CleanLayout maxWidth="7xl">
      <CleanPageHeader
        title="Professor Directory"
        description="Professors who work with head TAs"
        className="text-center mb-12"
      />
      
      <ProfessorPageSkeleton />
    </CleanLayout>
  );
}