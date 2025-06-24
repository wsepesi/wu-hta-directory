import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { 
  Course, 
  CourseWithRelations, 
  CreateCourseInput,
  CourseFilters,
  ApiResponse
} from '@/lib/types';

interface UseCoursesReturn {
  courses: Course[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCourses = (filters?: CourseFilters): UseCoursesReturn => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filters?.offeringPattern) {
        queryParams.append('offeringPattern', filters.offeringPattern);
      }

      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await apiClient.get<Course[]>(`/courses${query}`);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setCourses(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  }, [filters?.offeringPattern]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return {
    courses,
    loading,
    error,
    refetch: fetchCourses,
  };
};

interface UseCourseReturn {
  course: CourseWithRelations | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateCourse: (data: Partial<CreateCourseInput>) => Promise<ApiResponse<Course>>;
  deleteCourse: () => Promise<ApiResponse<void>>;
}

export const useCourse = (courseId: string): UseCourseReturn => {
  const [course, setCourse] = useState<CourseWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourse = useCallback(async () => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<CourseWithRelations>(`/courses/${courseId}`);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setCourse(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch course');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const updateCourse = useCallback(async (data: Partial<CreateCourseInput>): Promise<ApiResponse<Course>> => {
    const response = await apiClient.put<Course>(`/courses/${courseId}`, data);
    
    if (!response.error && response.data) {
      // Optimistically update the local state
      setCourse(prev => prev ? { ...prev, ...response.data } : null);
    }
    
    return response;
  }, [courseId]);

  const deleteCourse = useCallback(async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<void>(`/courses/${courseId}`);
    
    if (!response.error) {
      // Clear the local state on successful deletion
      setCourse(null);
    }
    
    return response;
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  return {
    course,
    loading,
    error,
    refetch: fetchCourse,
    updateCourse,
    deleteCourse,
  };
};

interface UseCreateCourseReturn {
  createCourse: (data: CreateCourseInput) => Promise<ApiResponse<Course>>;
  loading: boolean;
  error: string | null;
}

export const useCreateCourse = (): UseCreateCourseReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCourse = useCallback(async (data: CreateCourseInput): Promise<ApiResponse<Course>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<Course>('/courses', data);
      
      if (response.error) {
        setError(response.error);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create course';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createCourse,
    loading,
    error,
  };
};

// Additional hook for course offering management
export const useCourseOfferings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new course offering
  const createOffering = useCallback(async (data: {
    courseId: string;
    semester: string;
    year: number;
    season: string;
    professorId: string | null;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/course-offerings', data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create offering';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a course offering
  const updateOffering = useCallback(async (id: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.put(`/course-offerings/${id}`, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update offering';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a course offering
  const deleteOffering = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.delete(`/course-offerings/${id}`);
      if (response.error) {
        throw new Error(response.error);
      }
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete offering';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createOffering,
    updateOffering,
    deleteOffering,
  };
};