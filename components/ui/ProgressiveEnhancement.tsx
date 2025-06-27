'use client';

import { ReactNode, useEffect, useState } from 'react';

interface ProgressiveEnhancementProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

/**
 * Progressive enhancement wrapper that only renders interactive content
 * after JavaScript has loaded on the client
 */
export function ProgressiveEnhancement({
  children,
  fallback = null,
  className = '',
}: ProgressiveEnhancementProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <>{fallback}</>;
  }
  
  return <div className={className}>{children}</div>;
}