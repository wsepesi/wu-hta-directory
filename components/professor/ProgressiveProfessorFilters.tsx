import { ProfessorFiltersClient } from './ProfessorFiltersClient';
import { ProgressiveFormWrapper } from '@/components/shared/ProgressiveFormWrapper';
import Link from 'next/link';

interface ProgressiveProfessorFiltersProps {
  searchParams?: {
    search?: string;
  };
}

export function ProgressiveProfessorFilters({ searchParams }: ProgressiveProfessorFiltersProps) {
  // Non-JS form content
  const formContent = (
    <section className="mb-12">
      <form method="get">
        <div className="max-w-2xl mx-auto">
          <label htmlFor="search" className="font-serif text-sm uppercase tracking-wider text-charcoal/60 block mb-2">
            Search professors
          </label>
          <div className="flex">
            <input
              type="text"
              name="search"
              id="search"
              defaultValue={searchParams?.search}
              className="flex-1 bg-white border-b border-charcoal focus:border-charcoal focus:outline-none font-serif text-lg px-0 py-2"
              placeholder="Search by name or email..."
            />
            <button
              type="submit"
              className="ml-6 font-serif text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
            >
              Search
            </button>
            {searchParams?.search && (
              <Link
                href="/professors"
                className="ml-6 font-serif text-sm uppercase tracking-wider text-charcoal/60 hover:text-charcoal transition-colors duration-200"
              >
                Clear
              </Link>
            )}
          </div>
        </div>
      </form>
    </section>
  );

  // Enhanced client-side content
  const enhancedContent = (
    <ProfessorFiltersClient searchParams={searchParams} />
  );

  return (
    <ProgressiveFormWrapper enhancedContent={enhancedContent}>
      {formContent}
    </ProgressiveFormWrapper>
  );
}