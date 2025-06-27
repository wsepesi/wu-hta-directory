import { CourseFiltersClient } from './CourseFiltersClient';
import { ProgressiveFormWrapper } from '@/components/shared/ProgressiveFormWrapper';
import Link from 'next/link';

interface ProgressiveCourseFiltersProps {
  searchParams?: {
    search?: string;
  };
}

export function ProgressiveCourseFilters({ searchParams }: ProgressiveCourseFiltersProps) {
  // Non-JS form content
  const formContent = (
    <div className="mb-12">
      <form method="get" action="/courses" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="search" className="block text-sm font-serif uppercase tracking-wider text-charcoal mb-2">
              Search
            </label>
            <input
              type="text"
              name="search"
              id="search"
              defaultValue={searchParams?.search}
              className="block w-full border-b border-charcoal/20 bg-transparent px-0 py-2 text-charcoal placeholder-charcoal/50 focus:border-charcoal focus:outline-none transition-colors duration-200"
              placeholder="Course number or name"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          {searchParams?.search && (
            <Link
              href="/courses"
              className="text-sm font-serif uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
            >
              Clear
            </Link>
          )}
          <button
            type="submit"
            className="text-sm font-serif uppercase tracking-wider text-charcoal border border-charcoal px-6 py-2 hover:opacity-70 transition-opacity duration-200"
          >
            Apply
          </button>
        </div>
      </form>
    </div>
  );

  // Enhanced client-side content
  const enhancedContent = (
    <CourseFiltersClient searchParams={searchParams} />
  );

  return (
    <ProgressiveFormWrapper enhancedContent={enhancedContent}>
      {formContent}
    </ProgressiveFormWrapper>
  );
}