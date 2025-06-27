import { PeopleFiltersClient } from './PeopleFiltersClient';
import { ProgressiveFormWrapper } from '@/components/shared/ProgressiveFormWrapper';
import Link from 'next/link';

interface ProgressivePeopleFiltersProps {
  availableFilters: {
    gradYears: (number | null)[];
    locations: (string | null)[];
  };
  searchParams?: {
    search?: string;
    gradYear?: string;
    location?: string;
  };
}

export function ProgressivePeopleFilters({ 
  availableFilters,
  searchParams 
}: ProgressivePeopleFiltersProps) {
  // Non-JS form content
  const formContent = (
    <div className="bg-white border-t border-b border-charcoal/10 py-8 mb-12">
      <form method="get" className="space-y-6">
        {/* Hidden input to reset page to 1 when filters change */}
        <input type="hidden" name="page" value="1" />
        
        <div>
          <label htmlFor="search" className="font-serif text-sm uppercase tracking-wider text-charcoal block mb-2">
            Search
          </label>
          <input
            type="text"
            name="search"
            id="search"
            defaultValue={searchParams?.search}
            className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal placeholder-charcoal/50 focus:outline-none focus:border-charcoal transition-colors font-serif"
            placeholder="Search by name or email..."
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="gradYear" className="font-serif text-sm uppercase tracking-wider text-charcoal block mb-2">
              Graduation Year
            </label>
            <select
              name="gradYear"
              id="gradYear"
              defaultValue={searchParams?.gradYear}
              className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal focus:outline-none focus:border-charcoal transition-colors font-serif"
            >
              <option value="">All years</option>
              {availableFilters.gradYears.filter(year => year !== null).map((year) => (
                <option key={year} value={year!}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="location" className="font-serif text-sm uppercase tracking-wider text-charcoal block mb-2">
              Location
            </label>
            <select
              name="location"
              id="location"
              defaultValue={searchParams?.location}
              className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal focus:outline-none focus:border-charcoal transition-colors font-serif"
            >
              <option value="">All locations</option>
              {availableFilters.locations.filter(location => location !== null).map((location) => (
                <option key={location} value={location!}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            className="px-6 py-3 bg-charcoal text-white font-serif text-sm uppercase tracking-wider hover:opacity-80 transition-opacity"
          >
            Apply
          </button>
          {(searchParams?.search || searchParams?.gradYear || searchParams?.location) && (
            <Link
              href="/people"
              className="px-6 py-3 text-center text-charcoal font-serif text-sm uppercase tracking-wider hover:opacity-80 transition-opacity border border-charcoal"
            >
              Clear All
            </Link>
          )}
        </div>
      </form>
    </div>
  );

  // Enhanced client-side content
  const enhancedContent = (
    <PeopleFiltersClient
      availableFilters={availableFilters}
      searchParams={searchParams}
    />
  );

  return (
    <ProgressiveFormWrapper enhancedContent={enhancedContent}>
      {formContent}
    </ProgressiveFormWrapper>
  );
}