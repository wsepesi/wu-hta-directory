'use client';

import { Suspense, ReactNode } from 'react';
import type { ErrorInfo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
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
    <div className="space-y-4 p-8">
      {/* Generic content skeleton */}
      <div className="space-y-3">
        <Skeleton variant="text" className="h-8 w-2/3" />
        <Skeleton variant="text" className="h-5" />
        <Skeleton variant="text" className="h-5" />
        <Skeleton variant="text" className="h-5 w-4/5" />
      </div>
      <div className="pt-4">
        <Skeleton variant="rectangular" height={200} className="w-full" />
      </div>
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
      fallbackRender={({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => 
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

// Pre-configured skeleton loading states for common patterns
export const LoadingSkeletons = {
  Card: () => (
    <div className="p-6 bg-white border border-charcoal">
      <Skeleton variant="rectangular" height={200} className="mb-4" />
      <Skeleton variant="text" className="mb-2" />
      <Skeleton variant="text" width="60%" />
    </div>
  ),
  
  List: ({ count = 3 }: { count?: number }) => (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-white border border-charcoal">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1">
            <Skeleton variant="text" className="mb-2" />
            <Skeleton variant="text" width="75%" />
          </div>
        </div>
      ))}
    </div>
  ),
  
  Table: ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
    <div className="bg-white border border-charcoal overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-white border-b border-charcoal">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-3">
                <Skeleton variant="text" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-charcoal/20">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <Skeleton variant="text" width={colIndex === 0 ? '100%' : '80%'} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
  
  Form: () => (
    <div className="space-y-6 p-6 bg-white border border-charcoal">
      <div>
        <Skeleton variant="text" className="h-5 w-24 mb-2" />
        <Skeleton variant="rectangular" height={40} className="w-full" />
      </div>
      <div>
        <Skeleton variant="text" className="h-5 w-32 mb-2" />
        <Skeleton variant="rectangular" height={40} className="w-full" />
      </div>
      <div>
        <Skeleton variant="text" className="h-5 w-28 mb-2" />
        <Skeleton variant="rectangular" height={80} className="w-full" />
      </div>
      <Skeleton variant="rectangular" height={40} className="w-32" />
    </div>
  ),
  
  Profile: () => (
    <div className="flex items-start space-x-6 p-6">
      <Skeleton variant="circular" width={96} height={96} />
      <div className="flex-1 space-y-3">
        <Skeleton variant="text" className="h-8 w-1/3" />
        <Skeleton variant="text" className="h-5 w-1/4" />
        <div className="space-y-2 pt-2">
          <Skeleton variant="text" className="h-4" />
          <Skeleton variant="text" className="h-4" />
          <Skeleton variant="text" className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  ),
};