'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { routePrefetcher } from '@/lib/navigation/route-prefetcher';

export function useRoutePrefetcher() {
  const router = useRouter();
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    // Set router instance
    routePrefetcher.setRouter(router);

    // Track navigation patterns
    if (previousPathname.current !== pathname) {
      routePrefetcher.trackNavigation(previousPathname.current, pathname);
      previousPathname.current = pathname;
    }

    // Prefetch related routes for current path
    routePrefetcher.prefetchRelatedRoutes(pathname);

    // Prefetch visible links after a short delay
    const timeoutId = setTimeout(() => {
      const links = Array.from(
        document.querySelectorAll('a[href^="/"]')
      ) as HTMLAnchorElement[];
      
      const cleanup = routePrefetcher.prefetchVisibleLinks(links);

      // Cleanup on unmount
      return cleanup;
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname, router]);

  return {
    prefetchRoute: routePrefetcher.prefetchRoute.bind(routePrefetcher),
    getStats: routePrefetcher.getStats.bind(routePrefetcher),
  };
}