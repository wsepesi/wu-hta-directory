import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { PrefetchKind } from 'next/dist/client/components/router-reducer/router-reducer-types';

interface PrefetchOptions {
  priority?: 'high' | 'low';
  kind?: PrefetchKind;
}

interface RoutePattern {
  pattern: RegExp;
  priority: 'high' | 'low';
  relatedRoutes?: string[];
}

class RoutePrefetcher {
  private router: AppRouterInstance | null = null;
  private prefetchedRoutes = new Set<string>();
  private userPatterns: Map<string, number> = new Map();
  private routePatterns: RoutePattern[] = [
    // High priority routes - commonly accessed
    {
      pattern: /^\/courses$/,
      priority: 'high',
      relatedRoutes: ['/courses/[courseNumber]', '/semesters'],
    },
    {
      pattern: /^\/directory$/,
      priority: 'high',
      relatedRoutes: ['/people', '/profile/[userId]'],
    },
    {
      pattern: /^\/dashboard$/,
      priority: 'high',
      relatedRoutes: ['/dashboard/missing-records', '/profile'],
    },
    // Low priority routes
    {
      pattern: /^\/admin/,
      priority: 'low',
      relatedRoutes: ['/admin/users', '/admin/invitations'],
    },
  ];

  setRouter(router: AppRouterInstance) {
    this.router = router;
  }

  // Track user navigation patterns
  trackNavigation(from: string, to: string) {
    const key = `${from}->${to}`;
    const count = this.userPatterns.get(key) || 0;
    this.userPatterns.set(key, count + 1);

    // Prefetch frequently used paths
    if (count > 2) {
      this.prefetchRoute(to, { priority: 'high' });
    }
  }

  // Intelligent prefetching based on current route
  prefetchRelatedRoutes(currentPath: string) {
    if (!this.router) return;

    // Find matching pattern
    const matchedPattern = this.routePatterns.find(({ pattern }) =>
      pattern.test(currentPath)
    );

    if (matchedPattern?.relatedRoutes) {
      matchedPattern.relatedRoutes.forEach((route) => {
        // Don't prefetch dynamic routes directly
        if (!route.includes('[')) {
          this.prefetchRoute(route, { priority: matchedPattern.priority });
        }
      });
    }

    // Prefetch based on user patterns
    this.userPatterns.forEach((count, pattern) => {
      const [from, to] = pattern.split('->');
      if (from === currentPath && count > 1) {
        this.prefetchRoute(to, { priority: 'high' });
      }
    });
  }

  // Prefetch a specific route
  prefetchRoute(
    href: string,
    options: PrefetchOptions = { priority: 'low', kind: PrefetchKind.AUTO }
  ) {
    if (!this.router || this.prefetchedRoutes.has(href)) return;

    // Skip external URLs
    if (href.startsWith('http://') || href.startsWith('https://')) return;

    try {
      this.router.prefetch(href, { kind: options.kind || PrefetchKind.AUTO });
      this.prefetchedRoutes.add(href);

      // Clear from cache after 5 minutes
      setTimeout(() => {
        this.prefetchedRoutes.delete(href);
      }, 5 * 60 * 1000);
    } catch (error) {
      console.error('Prefetch error:', error);
    }
  }

  // Prefetch routes visible in viewport
  prefetchVisibleLinks(links: HTMLAnchorElement[]) {
    if (!this.router) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.getAttribute('href');
            if (href && !this.prefetchedRoutes.has(href)) {
              this.prefetchRoute(href, { priority: 'low' });
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    links.forEach((link) => observer.observe(link));

    return () => {
      links.forEach((link) => observer.unobserve(link));
    };
  }

  // Clear prefetch cache
  clearCache() {
    this.prefetchedRoutes.clear();
  }

  // Get prefetch statistics
  getStats() {
    return {
      prefetchedCount: this.prefetchedRoutes.size,
      userPatternsCount: this.userPatterns.size,
      topPatterns: Array.from(this.userPatterns.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
    };
  }
}

// Export singleton instance
export const routePrefetcher = new RoutePrefetcher();