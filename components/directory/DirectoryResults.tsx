import { DirectoryResultsClient } from './DirectoryResultsClient';

interface DirectoryEntry {
  id: string;
  firstName: string;
  lastName: string;
  gradYear?: number;
  location?: string;
  currentRole?: string;
  courses: Array<{
    courseNumber: string;
    courseName: string;
    semester: string;
    professor?: string;
  }>;
}

interface DirectoryResultsProps {
  data: DirectoryEntry[];
  searchParams?: {
    search?: string;
    gradYear?: string;
    location?: string;
    page?: string;
  };
}

export default async function DirectoryResults({ 
  data,
  searchParams 
}: DirectoryResultsProps) {
  // Convert data to ensure proper null handling
  const normalizedData = data.map(entry => ({
    ...entry,
    gradYear: entry.gradYear ?? null,
    location: entry.location ?? null,
    currentRole: entry.currentRole ?? null,
  }));

  return (
    <DirectoryResultsClient
      initialData={normalizedData}
      searchParams={searchParams}
    />
  );
}