'use client';

import { Suspense, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}

function DefaultErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="p-8">
      <ErrorMessage variant="error">
        <div className="space-y-2">
          <p className="font-semibold">Something went wrong</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </ErrorMessage>
      <Button 
        onClick={resetErrorBoundary}
        variant="secondary"
        size="sm"
        className="mt-4"
      >
        Try again
      </Button>
    </div>
  );
}

function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size="md" />
    </div>
  );
}

export function SuspenseWrapper({
  children,
  fallback = <DefaultLoadingFallback />,
  errorFallback,
  onError,
}: SuspenseWrapperProps) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => 
        errorFallback || <DefaultErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
      }
      onError={onError}
    >
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// Higher-order component version
export function withSuspense<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<SuspenseWrapperProps, 'children'>
) {
  return function WithSuspenseComponent(props: P) {
    return (
      <SuspenseWrapper {...options}>
        <Component {...props} />
      </SuspenseWrapper>
    );
  };
}