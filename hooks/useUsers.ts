import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { 
  User, 
  UserWithRelations, 
  CreateUserInput, 
  UpdateUserInput,
  UserFilters,
  ApiResponse
} from '@/lib/types';

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUsers = (filters?: UserFilters): UseUsersReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filters?.gradYear) queryParams.append('gradYear', filters.gradYear.toString());
      if (filters?.location) queryParams.append('location', filters.location);
      if (filters?.degreeProgram) queryParams.append('degreeProgram', filters.degreeProgram);

      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await apiClient.get<User[]>(`/users${query}`);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setUsers(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [filters?.gradYear, filters?.location, filters?.degreeProgram]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
  };
};

interface UseUserReturn {
  user: UserWithRelations | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateUser: (data: UpdateUserInput) => Promise<ApiResponse<User>>;
  deleteUser: () => Promise<ApiResponse<void>>;
}

export const useUser = (userId: string): UseUserReturn => {
  const [user, setUser] = useState<UserWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<UserWithRelations>(`/users/${userId}`);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setUser(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateUser = useCallback(async (data: UpdateUserInput): Promise<ApiResponse<User>> => {
    const response = await apiClient.put<User>(`/users/${userId}`, data);
    
    if (!response.error && response.data) {
      // Optimistically update the local state
      setUser(prev => prev ? { ...prev, ...response.data } : null);
    }
    
    return response;
  }, [userId]);

  const deleteUser = useCallback(async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<void>(`/users/${userId}`);
    
    if (!response.error) {
      // Clear the local state on successful deletion
      setUser(null);
    }
    
    return response;
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
    updateUser,
    deleteUser,
  };
};

interface UseCreateUserReturn {
  createUser: (data: CreateUserInput) => Promise<ApiResponse<User>>;
  loading: boolean;
  error: string | null;
}

export const useCreateUser = (): UseCreateUserReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = useCallback(async (data: CreateUserInput): Promise<ApiResponse<User>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<User>('/users', data);
      
      if (response.error) {
        setError(response.error);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createUser,
    loading,
    error,
  };
};