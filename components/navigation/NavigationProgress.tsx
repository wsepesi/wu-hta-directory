'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationProgress() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    const startProgress = () => {
      setIsNavigating(true);
      setProgress(0);
      
      let currentProgress = 0;
      progressInterval = setInterval(() => {
        currentProgress += Math.random() * 10;
        if (currentProgress > 90) {
          currentProgress = 90;
        }
        setProgress(currentProgress);
      }, 200);
    };

    const completeProgress = () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setProgress(100);
      
      timeoutId = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 300);
    };

    // Listen for navigation events
    const handleNavigationStart = () => startProgress();
    const handleNavigationEnd = () => completeProgress();

    // Custom event listeners for our progressive navigation
    window.addEventListener('navigationstart', handleNavigationStart);
    window.addEventListener('navigationend', handleNavigationEnd);

    // Also listen for Next.js route changes
    completeProgress();

    return () => {
      window.removeEventListener('navigationstart', handleNavigationStart);
      window.removeEventListener('navigationend', handleNavigationEnd);
      
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [pathname]);

  if (!isNavigating) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gradient-to-r from-charcoal/20 to-charcoal/20"
      role="progressbar"
      aria-label="Navigation progress"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-gradient-to-r from-charcoal to-charcoal/80 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}