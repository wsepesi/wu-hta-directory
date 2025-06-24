'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error boundary caught:', error);
    
    // You could send this to a service like Sentry here
    // logErrorToService(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-2">500</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Something went wrong!
          </h2>
          
          <ErrorMessage variant="error" className="mb-6 text-left">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </ErrorMessage>

          <div className="space-y-4">
            <Button
              onClick={reset}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Try again
            </Button>
            
            <Button
              onClick={() => window.location.href = '/'}
              variant="secondary"
              size="lg"
              className="w-full"
            >
              Go to homepage
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && error.stack && (
            <details className="mt-8 text-left">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                Error details (development only)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-x-auto">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}