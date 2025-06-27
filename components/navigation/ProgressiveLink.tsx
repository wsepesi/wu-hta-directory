'use client';

import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';
import { AnchorHTMLAttributes, MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

interface ProgressiveLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  'aria-label'?: string;
}

// Intelligent prefetching based on user interaction patterns
const PREFETCH_DELAY = 100; // Delay before prefetching on hover
const PREFETCH_TIMEOUT = 5000; // Cache prefetch for 5 seconds

export function ProgressiveLink({ 
  children, 
  className, 
  prefetch = true,
  onClick,
  ...props 
}: ProgressiveLinkProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>) {
  const router = useRouter();
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prefetchedRef = useRef<Set<string>>(new Set());
  const [isNavigating, setIsNavigating] = useState(false);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, []);

  // Intelligent prefetching on hover/focus
  const handlePrefetch = useCallback((href: string) => {
    if (!prefetch || prefetchedRef.current.has(href)) return;

    prefetchTimeoutRef.current = setTimeout(() => {
      router.prefetch(href);
      prefetchedRef.current.add(href);
      
      // Clear prefetch cache after timeout
      setTimeout(() => {
        prefetchedRef.current.delete(href);
      }, PREFETCH_TIMEOUT);
    }, PREFETCH_DELAY);
  }, [router, prefetch]);

  // Cancel prefetch on mouse leave
  const handleCancelPrefetch = useCallback(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }
  }, []);

  // Handle navigation with view transitions if supported
  const handleClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    // Call user's onClick if provided
    if (onClick) {
      onClick(e);
    }

    // Don't intercept if it's a modified click (cmd/ctrl/shift)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
      return;
    }

    // Don't intercept external links
    const href = typeof props.href === 'string' ? props.href : props.href.pathname || '';
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
      return;
    }

    // Don't intercept if prevented
    if (e.defaultPrevented) {
      return;
    }

    // Check if view transitions are supported
    if ('startViewTransition' in document && typeof document.startViewTransition === 'function') {
      e.preventDefault();
      setIsNavigating(true);

      // Start view transition
      document.startViewTransition(async () => {
        await router.push(href);
        setIsNavigating(false);
      });
    } else {
      // Let Next.js handle the navigation normally
      setIsNavigating(true);
      // Reset state after navigation
      setTimeout(() => setIsNavigating(false), 500);
    }
  }, [props.href, router, onClick]);

  const href = typeof props.href === 'string' ? props.href : props.href.pathname || '';

  return (
    <Link
      {...props}
      className={clsx(
        className,
        isNavigating && 'pointer-events-none opacity-75',
        'transition-opacity duration-200'
      )}
      onMouseEnter={() => handlePrefetch(href)}
      onFocus={() => handlePrefetch(href)}
      onMouseLeave={handleCancelPrefetch}
      onBlur={handleCancelPrefetch}
      onClick={handleClick}
      prefetch={false} // We handle prefetching ourselves
    >
      {children}
    </Link>
  );
}