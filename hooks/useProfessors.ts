import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { 
  Professor,
  CreateProfessorInput,
  ApiResponse
} from '@/lib/types';

interface UseProfessorsReturn {
  professors: Professor[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useProfessors = (): UseProfessorsReturn => {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfessors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<Professor[]>('/professors');

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setProfessors(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch professors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfessors();
  }, [fetchProfessors]);

  return {
    professors,
    loading,
    error,
    refetch: fetchProfessors,
  };
};

interface UseProfessorReturn {
  professor: Professor | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfessor: (data: Partial<CreateProfessorInput>) => Promise<ApiResponse<Professor>>;
  deleteProfessor: () => Promise<ApiResponse<void>>;
}

export const useProfessor = (professorId: string): UseProfessorReturn => {
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfessor = useCallback(async () => {
    if (!professorId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<Professor>(`/professors/${professorId}`);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setProfessor(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch professor');
    } finally {
      setLoading(false);
    }
  }, [professorId]);

  const updateProfessor = useCallback(async (data: Partial<CreateProfessorInput>): Promise<ApiResponse<Professor>> => {
    const response = await apiClient.put<Professor>(`/professors/${professorId}`, data);
    
    if (!response.error && response.data) {
      // Optimistically update the local state
      setProfessor(response.data);
    }
    
    return response;
  }, [professorId]);

  const deleteProfessor = useCallback(async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<void>(`/professors/${professorId}`);
    
    if (!response.error) {
      // Clear the local state on successful deletion
      setProfessor(null);
    }
    
    return response;
  }, [professorId]);

  useEffect(() => {
    fetchProfessor();
  }, [fetchProfessor]);

  return {
    professor,
    loading,
    error,
    refetch: fetchProfessor,
    updateProfessor,
    deleteProfessor,
  };
};

interface UseCreateProfessorReturn {
  createProfessor: (data: CreateProfessorInput) => Promise<ApiResponse<Professor>>;
  loading: boolean;
  error: string | null;
}

export const useCreateProfessor = (): UseCreateProfessorReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProfessor = useCallback(async (data: CreateProfessorInput): Promise<ApiResponse<Professor>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<Professor>('/professors', data);
      
      if (response.error) {
        setError(response.error);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create professor';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createProfessor,
    loading,
    error,
  };
};

// Helper hook to search professors by name
interface UseSearchProfessorsReturn {
  professors: Professor[];
  loading: boolean;
  error: string | null;
  searchProfessors: (query: string) => Promise<void>;
}

export const useSearchProfessors = (): UseSearchProfessorsReturn => {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchProfessors = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProfessors([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<Professor[]>(`/professors/search?q=${encodeURIComponent(query)}`);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setProfessors(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search professors');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    professors,
    loading,
    error,
    searchProfessors,
  };
};