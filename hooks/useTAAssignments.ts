import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { TAAssignment, CreateTAAssignmentInput } from '@/lib/types';

export function useTAAssignments() {
  const [assignments, setAssignments] = useState<TAAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async (filters?: { userId?: string; courseOfferingId?: string }) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filters?.userId) queryParams.append('userId', filters.userId);
      if (filters?.courseOfferingId) queryParams.append('courseOfferingId', filters.courseOfferingId);

      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await apiClient.get<TAAssignment[]>(`/ta-assignments${query}`);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setAssignments(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  const createAssignment = useCallback(async (data: CreateTAAssignmentInput) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<TAAssignment>('/ta-assignments', data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create assignment';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAssignment = useCallback(async (id: string, data: Partial<CreateTAAssignmentInput>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.put<TAAssignment>(`/ta-assignments/${id}`, data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update assignment';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAssignment = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.delete(`/ta-assignments/${id}`);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete assignment';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get TA assignment suggestions for a course
  const getSuggestions = async (courseOfferingId: string) => {
    try {
      const response = await fetch(`/api/ta-assignments?courseOfferingId=${courseOfferingId}&suggestions=true`);
      if (!response.ok) throw new Error('Failed to get suggestions');
      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw error;
    }
  };

  // Assign a TA to a course
  const assignTA = async (data: {
    courseOfferingId: string;
    userId: string;
    hoursPerWeek: number;
  }) => {
    try {
      const response = await fetch('/api/ta-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign TA');
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error assigning TA:', error);
      throw error;
    }
  };

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getSuggestions,
    assignTA,
  };
}