'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { retry } from '@/lib/utils';

interface ErrorRecoveryProps {
  error: Error;
  retry?: () => void | Promise<void>;
  maxRetries?: number;
  retryDelay?: number;
  showDetails?: boolean;
  customMessage?: string;
  onRetrySuccess?: () => void;
  onRetryFailure?: (error: Error) => void;
}

export function ErrorRecovery({
  error,
  retry: retryFn,
  maxRetries = 3,
  retryDelay = 1000,
  showDetails = process.env.NODE_ENV === 'development',
  customMessage,
  onRetrySuccess,
  onRetryFailure,
}: ErrorRecoveryProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const handleRetry = useCallback(async () => {
    if (!retryFn) return;
    
    setIsRetrying(true);
    
    try {
      if (retryFn.constructor.name === 'AsyncFunction') {
        await retryFn();
      } else {
        retryFn();
      }
      
      onRetrySuccess?.();
    } catch (error) {
      setRetryCount(prev => prev + 1);
      
      if (retryCount < maxRetries) {
        // Start countdown for next retry
        setCountdown(Math.floor(retryDelay / 1000));
      } else {
        onRetryFailure?.(error as Error);
      }
    } finally {
      setIsRetrying(false);
    }
  }, [retryFn, onRetrySuccess, retryCount, maxRetries, retryDelay, onRetryFailure]);

  // Auto-retry logic with countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (countdown === 0 && retryCount > 0 && retryCount <= maxRetries) {
      handleRetry();
    }
  }, [countdown, retryCount, maxRetries, handleRetry]);

  const getErrorMessage = () => {
    if (customMessage) return customMessage;
    
    // Common error messages
    if (error.message.includes('fetch')) {
      return 'Failed to load data. Please check your connection.';
    } else if (error.message.includes('Network')) {
      return 'Network error. Please check your internet connection.';
    } else if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    } else if (error.message.includes('404')) {
      return 'The requested resource was not found.';
    } else if (error.message.includes('401') || error.message.includes('403')) {
      return 'You don&apos;t have permission to access this resource.';
    } else if (error.message.includes('500')) {
      return 'Server error. Please try again later.';
    }
    
    return error.message || 'An unexpected error occurred.';
  };

  return (
    <div className="space-y-4">
      <ErrorMessage variant="error">
        <div className="space-y-2">
          <p className="font-semibold">Oops! Something went wrong</p>
          <p className="text-sm">{getErrorMessage()}</p>
          
          {retryCount > 0 && retryCount <= maxRetries && (
            <p className="text-xs">
              Retry attempt {retryCount} of {maxRetries}
              {countdown > 0 && ` - Retrying in ${countdown}s...`}
            </p>
          )}
          
          {retryCount > maxRetries && (
            <p className="text-xs text-red-600">
              Maximum retry attempts reached. Please refresh the page or contact support.
            </p>
          )}
        </div>
      </ErrorMessage>

      <div className="flex gap-2">
        {retryFn && retryCount <= maxRetries && (
          <Button
            onClick={() => {
              setRetryCount(prev => prev + 1);
              handleRetry();
            }}
            disabled={isRetrying || countdown > 0}
            variant="primary"
            size="sm"
          >
            {isRetrying ? 'Retrying...' : countdown > 0 ? `Retrying in ${countdown}s...` : 'Try Again'}
          </Button>
        )}
        
        <Button
          onClick={() => window.location.href = '/'}
          variant="secondary"
          size="sm"
        >
          Go Home
        </Button>
        
        <Button
          onClick={() => window.location.reload()}
          variant="secondary"
          size="sm"
        >
          Refresh Page
        </Button>
      </div>

      {showDetails && error.stack && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            Technical details
          </summary>
          <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-x-auto">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}

// Hook for error recovery
export function useErrorRecovery(options?: {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
}) {
  const [error, setError] = useState<Error | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  const recover = async (fn: () => Promise<void>) => {
    setIsRecovering(true);
    setError(null);

    try {
      await retry(fn, {
        maxAttempts: options?.maxRetries || 3,
        delay: options?.retryDelay || 1000,
        onRetry: (error, attempt) => {
          console.log(`Retry attempt ${attempt} after error:`, error.message);
        },
      });
    } catch (error) {
      const err = error as Error;
      setError(err);
      options?.onError?.(err);
    } finally {
      setIsRecovering(false);
    }
  };

  return {
    error,
    isRecovering,
    recover,
    clearError: () => setError(null),
  };
}