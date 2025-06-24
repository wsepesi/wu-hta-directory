import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import type { 
  User,
  Course,
  Professor,
  ApiResponse
} from '@/lib/types';

interface SearchResults {
  users: User[];
  courses: Course[];
  professors: Professor[];
}

interface UseSearchReturn {
  results: SearchResults;
  loading: boolean;
  error: string | null;
  search: (query: string) => void;
  clearResults: () => void;
  query: string;
}

export const useSearch = (debounceMs: number = 300): UseSearchReturn => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({
    users: [],
    courses: [],
    professors: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({
        users: [],
        courses: [],
        professors: [],
      });
      setLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<SearchResults>(
        `/search?q=${encodeURIComponent(searchQuery)}`,
        {
          signal: abortControllerRef.current.signal,
        }
      );

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setResults(response.data);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!searchQuery.trim()) {
      setResults({
        users: [],
        courses: [],
        professors: [],
      });
      setLoading(false);
      return;
    }

    // Set loading immediately for better UX
    setLoading(true);

    // Debounce the search
    debounceTimerRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, debounceMs);
  }, [performSearch, debounceMs]);

  const clearResults = useCallback(() => {
    setQuery('');
    setResults({
      users: [],
      courses: [],
      professors: [],
    });
    setError(null);
    
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear any pending timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
    query,
  };
};

// Specialized search hooks for specific entity types
interface UseEntitySearchReturn<T> {
  results: T[];
  loading: boolean;
  error: string | null;
  search: (query: string) => void;
  clearResults: () => void;
  query: string;
}

export const useUserSearch = (debounceMs: number = 300): UseEntitySearchReturn<User> => {
  const { results, loading, error, search, clearResults, query } = useSearch(debounceMs);
  
  return {
    results: results.users,
    loading,
    error,
    search,
    clearResults,
    query,
  };
};

export const useCourseSearch = (debounceMs: number = 300): UseEntitySearchReturn<Course> => {
  const { results, loading, error, search, clearResults, query } = useSearch(debounceMs);
  
  return {
    results: results.courses,
    loading,
    error,
    search,
    clearResults,
    query,
  };
};

export const useProfessorSearch = (debounceMs: number = 300): UseEntitySearchReturn<Professor> => {
  const { results, loading, error, search, clearResults, query } = useSearch(debounceMs);
  
  return {
    results: results.professors,
    loading,
    error,
    search,
    clearResults,
    query,
  };
};

// Hook for instant search (no debouncing)
export const useInstantSearch = () => {
  return useSearch(0);
};