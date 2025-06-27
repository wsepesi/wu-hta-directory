'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationWrapperProps {
  children: React.ReactNode;
}

export function NavigationWrapper({ children }: NavigationWrapperProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Emit custom navigation events for the progress indicator
    const handleNavigationStart = () => {
      window.dispatchEvent(new Event('navigationstart'));
    };

    const handleNavigationEnd = () => {
      window.dispatchEvent(new Event('navigationend'));
    };

    // Intercept all navigation attempts
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (!anchor || !anchor.href) return;
      
      // Check if it's an internal link
      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin) return;
      
      // Check if view transitions are supported
      if ('startViewTransition' in document && typeof document.startViewTransition === 'function') {
        // Navigation will be handled by ProgressiveLink
        handleNavigationStart();
      }
    };

    document.addEventListener('click', handleClick);

    // Trigger navigation end when pathname changes
    handleNavigationEnd();

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [pathname]);

  return <>{children}</>;
}