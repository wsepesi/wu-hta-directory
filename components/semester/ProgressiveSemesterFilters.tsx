import { SemesterFiltersClient } from './SemesterFiltersClient';
import { ProgressiveFormWrapper } from '@/components/shared/ProgressiveFormWrapper';
import Link from 'next/link';

interface ProgressiveSemesterFiltersProps {
  availableYears: number[];
  yearFilter?: number;
}

export function ProgressiveSemesterFilters({ 
  availableYears,
  yearFilter 
}: ProgressiveSemesterFiltersProps) {
  // Non-JS form content
  const formContent = (
    <div className="mb-16 border-b border-charcoal/10 pb-8">
      <form method="get" className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
        <label htmlFor="year" className="font-serif text-xs sm:text-sm uppercase tracking-wider text-charcoal">
          Filter by year
        </label>
        <select
          name="year"
          id="year"
          defaultValue={yearFilter || ''}
          className="font-serif border-b border-charcoal/20 bg-transparent text-charcoal focus:border-charcoal focus:outline-none px-2 py-1 text-sm sm:text-base"
        >
          <option value="">All years</option>
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="font-serif text-xs sm:text-sm uppercase tracking-wider text-charcoal border-b border-charcoal hover:opacity-70 transition-opacity duration-200 px-2 py-1"
        >
          Apply
        </button>
        {yearFilter && (
          <Link
            href="/semesters"
            className="font-serif text-xs sm:text-sm text-charcoal/60 hover:text-charcoal transition-colors duration-200"
          >
            Clear
          </Link>
        )}
      </form>
    </div>
  );

  // Enhanced client-side content
  const enhancedContent = (
    <SemesterFiltersClient
      availableYears={availableYears}
      yearFilter={yearFilter}
    />
  );

  return (
    <ProgressiveFormWrapper enhancedContent={enhancedContent}>
      {formContent}
    </ProgressiveFormWrapper>
  );
}