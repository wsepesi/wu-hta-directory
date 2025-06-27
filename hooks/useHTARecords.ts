import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { TAAssignment, CreateTAAssignmentInput } from '@/lib/types';

export function useHTARecords() {
  const [records, setRecords] = useState<TAAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async (filters?: { userId?: string; courseOfferingId?: string }) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filters?.userId) queryParams.append('userId', filters.userId);
      if (filters?.courseOfferingId) queryParams.append('courseOfferingId', filters.courseOfferingId);

      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await apiClient.get<TAAssignment[]>(`/hta-records${query}`);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setRecords(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  }, []);

  const createRecord = useCallback(async (data: CreateTAAssignmentInput) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<TAAssignment>('/hta-records', data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create record';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRecord = useCallback(async (id: string, data: Partial<CreateTAAssignmentInput>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.put<TAAssignment>(`/hta-records/${id}`, data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update record';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRecord = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.delete(`/hta-records/${id}`);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete record';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get Head TA record suggestions for a course
  const getSuggestions = async (courseOfferingId: string) => {
    try {
      const response = await fetch(`/api/hta-records?courseOfferingId=${courseOfferingId}&suggestions=true`);
      if (!response.ok) throw new Error('Failed to get suggestions');
      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw error;
    }
  };

  // Record a Head TA for a course
  const recordHeadTA = async (data: {
    courseOfferingId: string;
    userId: string;
    hoursPerWeek: number;
    autoInvite?: boolean;
  }) => {
    try {
      const response = await fetch('/api/hta-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record Head TA');
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error recording Head TA:', error);
      throw error;
    }
  };

  return {
    records,
    loading,
    error,
    fetchRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    getSuggestions,
    recordHeadTA,
  };
}