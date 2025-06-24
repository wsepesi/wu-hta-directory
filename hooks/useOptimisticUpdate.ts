import { useState, useCallback } from 'react';
import { cache } from '@/lib/cache';
import type { ApiResponse } from '@/lib/types';

interface UseOptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  resetDelay?: number;
  optimisticData?: T;
  cacheKey?: string | string[];
  invalidateCache?: string | string[] | RegExp;
}

interface UseOptimisticUpdateReturn<T, P> {
  execute: (payload: P) => Promise<void>;
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  reset: () => void;
}

export function useOptimisticUpdate<T, P = any>(
  mutationFn: (payload: P) => Promise<ApiResponse<T>>,
  options?: UseOptimisticUpdateOptions<T>
): UseOptimisticUpdateReturn<T, P> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { 
    onSuccess, 
    onError, 
    resetDelay = 3000,
    optimisticData,
    cacheKey,
    invalidateCache,
  } = options || {};

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setSuccess(false);
  }, []);

  const execute = useCallback(async (payload: P) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Apply optimistic update
    if (optimisticData) {
      setData(optimisticData);
      
      // Update cache optimistically
      if (cacheKey) {
        const keys = Array.isArray(cacheKey) ? cacheKey : [cacheKey];
        keys.forEach(key => cache.set(key, optimisticData));
      }
    }

    try {
      const response = await mutationFn(payload);

      if (response.error) {
        // Revert optimistic update on error
        if (optimisticData) {
          setData(null);
          if (cacheKey) {
            const keys = Array.isArray(cacheKey) ? cacheKey : [cacheKey];
            keys.forEach(key => cache.delete(key));
          }
        }
        
        setError(response.error);
        onError?.(response.error);
      } else if (response.data) {
        setData(response.data);
        setSuccess(true);
        
        // Update cache with real data
        if (cacheKey) {
          const keys = Array.isArray(cacheKey) ? cacheKey : [cacheKey];
          keys.forEach(key => cache.set(key, response.data));
        }
        
        // Invalidate related caches
        if (invalidateCache) {
          if (typeof invalidateCache === 'string') {
            cache.delete(invalidateCache);
          } else if (Array.isArray(invalidateCache)) {
            invalidateCache.forEach(key => cache.delete(key));
          } else if (invalidateCache instanceof RegExp) {
            cache.clearPattern(invalidateCache);
          }
        }
        
        onSuccess?.(response.data);

        // Auto-reset success state after delay
        if (resetDelay > 0) {
          setTimeout(() => {
            setSuccess(false);
          }, resetDelay);
        }
      }
    } catch (err) {
      // Revert optimistic update on error
      if (optimisticData) {
        setData(null);
        if (cacheKey) {
          const keys = Array.isArray(cacheKey) ? cacheKey : [cacheKey];
          keys.forEach(key => cache.delete(key));
        }
      }
      
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [mutationFn, onSuccess, onError, resetDelay, optimisticData, cacheKey, invalidateCache]);

  return {
    execute,
    data,
    loading,
    error,
    success,
    reset,
  };
}

// Hook for handling form submissions with optimistic updates
interface UseFormSubmitOptions<T> extends UseOptimisticUpdateOptions<T> {
  validateFn?: (data: any) => string[] | null;
}

export function useFormSubmit<T>(
  submitFn: (data: any) => Promise<ApiResponse<T>>,
  options?: UseFormSubmitOptions<T>
) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const { validateFn, ...optimisticOptions } = options || {};
  
  const optimistic = useOptimisticUpdate(submitFn, optimisticOptions);

  const submit = useCallback(async (formData: any) => {
    // Clear previous validation errors
    setValidationErrors([]);

    // Run validation if provided
    if (validateFn) {
      const errors = validateFn(formData);
      if (errors && errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
    }

    // Execute the submission
    await optimistic.execute(formData);
  }, [validateFn, optimistic]);

  return {
    ...optimistic,
    submit,
    validationErrors,
    clearValidationErrors: () => setValidationErrors([]),
  };
}