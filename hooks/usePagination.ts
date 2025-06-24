import { useState, useCallback, useMemo } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

interface UsePaginationReturn {
  currentPage: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToPage: (page: number) => void;
  goToFirstPage: () => void;
  goToLastPage: (totalPages: number) => void;
  goToNextPage: (totalPages: number) => void;
  goToPreviousPage: () => void;
  canGoToNextPage: (totalPages: number) => boolean;
  canGoToPreviousPage: boolean;
  getPageNumbers: (totalPages: number, maxVisible?: number) => (number | string)[];
  getPaginationInfo: (totalItems: number) => {
    from: number;
    to: number;
    total: number;
  };
}

export const usePagination = (options?: UsePaginationOptions): UsePaginationReturn => {
  const {
    initialPage = 1,
    initialPageSize = 20,
    pageSizeOptions = [10, 20, 50, 100],
  } = options || {};

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const goToPage = useCallback((page: number) => {
    if (page >= 1) {
      setCurrentPage(page);
    }
  }, []);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback((totalPages: number) => {
    setCurrentPage(totalPages);
  }, []);

  const goToNextPage = useCallback((totalPages: number) => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, []);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const canGoToPreviousPage = useMemo(() => currentPage > 1, [currentPage]);
  
  const canGoToNextPage = useCallback((totalPages: number) => {
    return currentPage < totalPages;
  }, [currentPage]);

  const getPageNumbers = useCallback((totalPages: number, maxVisible: number = 7): (number | string)[] => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    const leftSiblings = Math.floor((maxVisible - 3) / 2);
    const rightSiblings = Math.ceil((maxVisible - 3) / 2);

    if (currentPage <= leftSiblings + 1) {
      // Near the beginning
      for (let i = 1; i <= maxVisible - 2; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - rightSiblings) {
      // Near the end
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - (maxVisible - 3); i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // In the middle
      pages.push(1);
      pages.push('...');
      for (let i = currentPage - leftSiblings; i <= currentPage + rightSiblings; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage]);

  const getPaginationInfo = useCallback((totalItems: number) => {
    const from = (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, totalItems);
    
    return {
      from: totalItems > 0 ? from : 0,
      to,
      total: totalItems,
    };
  }, [currentPage, pageSize]);

  // Reset to first page when page size changes
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize: handlePageSizeChange,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    canGoToNextPage,
    canGoToPreviousPage,
    getPageNumbers,
    getPaginationInfo,
  };
};

// Hook for URL-based pagination (syncs with query params)
import { useRouter, useSearchParams } from 'next/navigation';

export const useUrlPagination = (options?: UsePaginationOptions) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentPage = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || String(options?.initialPageSize || 20));

  const updateUrl = useCallback((page: number, size?: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    if (size !== undefined) {
      params.set('pageSize', size.toString());
    }
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const pagination = usePagination({
    ...options,
    initialPage: currentPage,
    initialPageSize: pageSize,
  });

  return {
    ...pagination,
    currentPage,
    pageSize,
    goToPage: (page: number) => updateUrl(page),
    setPageSize: (size: number) => updateUrl(1, size),
    goToFirstPage: () => updateUrl(1),
    goToLastPage: (totalPages: number) => updateUrl(totalPages),
    goToNextPage: (totalPages: number) => updateUrl(Math.min(currentPage + 1, totalPages)),
    goToPreviousPage: () => updateUrl(Math.max(currentPage - 1, 1)),
  };
};