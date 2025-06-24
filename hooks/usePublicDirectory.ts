import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { 
  PublicDirectoryEntry,
  UserFilters
} from '@/lib/types';

interface UsePublicDirectoryReturn {
  entries: PublicDirectoryEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  goToPage: (page: number) => void;
}

interface PublicDirectoryParams extends UserFilters {
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'gradYear' | 'location';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export const usePublicDirectory = (params?: PublicDirectoryParams): UsePublicDirectoryReturn => {
  const {
    page = 1,
    pageSize = 20,
    sortBy = 'name',
    sortOrder = 'asc',
    search = '',
    gradYear,
    location,
    degreeProgram,
  } = params || {};

  const [entries, setEntries] = useState<PublicDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [totalPages, setTotalPages] = useState(0);

  const fetchDirectory = useCallback(async (pageNum: number = currentPage) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', pageNum.toString());
      queryParams.append('pageSize', pageSize.toString());
      queryParams.append('sortBy', sortBy);
      queryParams.append('sortOrder', sortOrder);
      
      if (search) queryParams.append('search', search);
      if (gradYear) queryParams.append('gradYear', gradYear.toString());
      if (location) queryParams.append('location', location);
      if (degreeProgram) queryParams.append('degreeProgram', degreeProgram);

      const query = queryParams.toString();
      const response = await apiClient.get<{
        entries: PublicDirectoryEntry[];
        totalCount: number;
        currentPage: number;
        totalPages: number;
        pageSize: number;
      }>(`/public/directory?${query}`);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setEntries(response.data.entries);
        setTotalCount(response.data.totalCount);
        setCurrentPage(response.data.currentPage);
        setTotalPages(response.data.totalPages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch directory');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortBy, sortOrder, search, gradYear, location, degreeProgram]);

  const goToPage = useCallback((pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      fetchDirectory(pageNum);
    }
  }, [totalPages, fetchDirectory]);

  useEffect(() => {
    fetchDirectory(page);
  }, [page, pageSize, sortBy, sortOrder, search, gradYear, location, degreeProgram]);

  return {
    entries,
    loading,
    error,
    refetch: () => fetchDirectory(currentPage),
    totalCount,
    currentPage,
    totalPages,
    pageSize,
    goToPage,
  };
};

// Hook for fetching a single public directory entry
interface UsePublicProfileReturn {
  profile: PublicDirectoryEntry | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const usePublicProfile = (userId: string): UsePublicProfileReturn => {
  const [profile, setProfile] = useState<PublicDirectoryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<PublicDirectoryEntry>(`/public/directory/${userId}`);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setProfile(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  };
};

// Hook for directory statistics
interface DirectoryStats {
  totalMembers: number;
  membersByGradYear: Record<number, number>;
  membersByLocation: Record<string, number>;
  membersByDegreeProgram: Record<string, number>;
  totalCourses: number;
  mostTaughtCourses: Array<{
    courseNumber: string;
    courseName: string;
    count: number;
  }>;
}

interface UseDirectoryStatsReturn {
  stats: DirectoryStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDirectoryStats = (): UseDirectoryStatsReturn => {
  const [stats, setStats] = useState<DirectoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<DirectoryStats>('/public/directory/stats');

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setStats(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch directory stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

// Hook for filtering options (to populate dropdowns)
interface FilterOptions {
  gradYears: number[];
  locations: string[];
  degreePrograms: string[];
}

interface UseFilterOptionsReturn {
  options: FilterOptions | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useFilterOptions = (): UseFilterOptionsReturn => {
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<FilterOptions>('/public/directory/filter-options');

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setOptions(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch filter options');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return {
    options,
    loading,
    error,
    refetch: fetchOptions,
  };
};