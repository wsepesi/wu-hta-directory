'use client';

import { clsx } from 'clsx';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showFirstLast = true,
  maxVisiblePages = 7,
}: PaginationProps) {
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Calculate range around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pages = generatePageNumbers();

  return (
    <nav
      className={clsx('flex items-center justify-center', className)}
      aria-label="Pagination"
    >
      <div className="flex items-center space-x-1">
        {/* First Page Button - Desktop Only */}
        {showFirstLast && (
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="hidden sm:inline-flex items-center justify-center px-2 py-1 text-sm font-serif text-charcoal bg-transparent border border-charcoal hover:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-charcoal focus:ring-offset-1 transition-opacity duration-200"
            aria-label="Go to first page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center justify-center px-2 py-1 text-sm font-serif text-charcoal bg-transparent border border-charcoal hover:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-charcoal focus:ring-offset-1 transition-opacity duration-200"
          aria-label="Go to previous page"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page Numbers - Desktop */}
        <div className="hidden sm:flex items-center space-x-1">
          {pages.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-sm text-charcoal/60 font-serif"
                >
                  ...
                </span>
              );
            }
            
            const pageNumber = page as number;
            const isActive = pageNumber === currentPage;
            
            return (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                className={clsx(
                  'inline-flex items-center justify-center px-3 py-2 text-sm font-serif focus:outline-none focus:ring-1 focus:ring-charcoal focus:ring-offset-1 transition-opacity duration-200',
                  isActive
                    ? 'bg-charcoal text-white'
                    : 'text-charcoal bg-transparent border border-charcoal hover:opacity-70'
                )}
                aria-label={`Go to page ${pageNumber}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        {/* Page Info - Mobile */}
        <div className="sm:hidden flex items-center px-3 py-2 text-sm text-charcoal font-serif">
          Page {currentPage} of {totalPages}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center justify-center px-2 py-1 text-sm font-serif text-charcoal bg-transparent border border-charcoal hover:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-charcoal focus:ring-offset-1 transition-opacity duration-200"
          aria-label="Go to next page"
        >
          <span className="hidden sm:inline">Next</span>
          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Last Page Button - Desktop Only */}
        {showFirstLast && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="hidden sm:inline-flex items-center justify-center px-2 py-1 text-sm font-serif text-charcoal bg-transparent border border-charcoal hover:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-charcoal focus:ring-offset-1 transition-opacity duration-200"
            aria-label="Go to last page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </nav>
  );
}