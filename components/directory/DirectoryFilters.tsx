import { ProgressiveDirectoryFilters } from './ProgressiveDirectoryFilters';

interface DirectoryFiltersProps {
  availableFilters: {
    gradYears: number[];
    locations: string[];
  };
  searchParams?: {
    search?: string;
    gradYear?: string;
    location?: string;
  };
}

export default async function DirectoryFilters({ 
  availableFilters,
  searchParams 
}: DirectoryFiltersProps) {
  return (
    <ProgressiveDirectoryFilters
      availableFilters={availableFilters}
      searchParams={searchParams}
    />
  );
}