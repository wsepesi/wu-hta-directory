import { DirectoryFiltersClient } from './DirectoryFiltersClient';
import { ProgressiveFormWrapper } from '@/components/shared/ProgressiveFormWrapper';

interface ProgressiveDirectoryFiltersProps {
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

/**
 * Progressive enhancement wrapper for directory filters
 * - Works as a regular form without JavaScript
 * - Enhances to live filtering when JavaScript is available
 */
export function ProgressiveDirectoryFilters({ 
  availableFilters,
  searchParams 
}: ProgressiveDirectoryFiltersProps) {
  // Non-JS form content
  const formContent = (
    <div className="bg-white border-t border-b border-charcoal/10 py-8 mb-12">
      <h2 className="font-serif text-xl text-charcoal mb-6">Search & Filter</h2>
      <form method="GET" action="/directory" className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Hidden input to reset page to 1 when filters change */}
        <input type="hidden" name="page" value="1" />
        
        <input
          type="search"
          name="search"
          placeholder="Search by name or course..."
          defaultValue={searchParams?.search || ""}
          className="px-4 py-3 border border-charcoal/20 bg-white text-charcoal placeholder-charcoal/50 focus:outline-none focus:border-charcoal transition-colors font-serif"
        />
        
        <select
          name="gradYear"
          defaultValue={searchParams?.gradYear || ""}
          className="px-4 py-3 border border-charcoal/20 bg-white text-charcoal focus:outline-none focus:border-charcoal transition-colors font-serif"
        >
          <option value="">All Years</option>
          {availableFilters.gradYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        <select
          name="location"
          defaultValue={searchParams?.location || ""}
          className="px-4 py-3 border border-charcoal/20 bg-white text-charcoal focus:outline-none focus:border-charcoal transition-colors font-serif"
        >
          <option value="">All Locations</option>
          {availableFilters.locations.map(location => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>

        <button
          type="submit"
          className="px-6 py-3 bg-charcoal text-white font-serif text-sm uppercase tracking-wider hover:opacity-80 transition-opacity"
        >
          Apply
        </button>
        
        {/* Clear filters link - works without JS */}
        {(searchParams?.search || searchParams?.gradYear || searchParams?.location) && (
          <a
            href="/directory"
            className="px-6 py-3 text-center text-charcoal font-serif text-sm uppercase tracking-wider hover:opacity-80 transition-opacity border border-charcoal"
          >
            Clear
          </a>
        )}
      </form>
    </div>
  );

  // Enhanced client-side content
  const enhancedContent = (
    <DirectoryFiltersClient
      availableFilters={availableFilters}
      searchParams={searchParams}
    />
  );

  return (
    <ProgressiveFormWrapper
      enhancedContent={enhancedContent}
    >
      {formContent}
    </ProgressiveFormWrapper>
  );
}