'use client';

import { useEffect } from 'react';
import { useRoutePrefetcher } from '@/hooks/useRoutePrefetcher';

interface ProgressiveEnhancementProviderProps {
  children: React.ReactNode;
}

export function ProgressiveEnhancementProvider({ children }: ProgressiveEnhancementProviderProps) {
  const { prefetchRoute } = useRoutePrefetcher();

  useEffect(() => {
    // Add progressive enhancement classes
    if (typeof window !== 'undefined') {
      // Check for view transitions support
      if ('startViewTransition' in document) {
        document.documentElement.classList.add('view-transitions-supported');
      }

      // Check for service worker support
      if ('serviceWorker' in navigator) {
        document.documentElement.classList.add('service-worker-supported');
      }

      // Prefetch critical routes on page load
      const criticalRoutes = ['/directory', '/courses', '/dashboard'];
      criticalRoutes.forEach(route => {
        prefetchRoute(route, { priority: 'high' });
      });
    }
  }, [prefetchRoute]);

  return <>{children}</>;
}