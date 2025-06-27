'use client';

import { useEffect, useState } from 'react';

interface ProgressiveEnhancementProps {
  fallback: React.ReactNode;
  enhanced: React.ReactNode;
  children?: never;
}

/**
 * Component that provides progressive enhancement pattern
 * Shows fallback content when JS is disabled, enhanced content when JS is enabled
 */
export function ProgressiveEnhancement({ fallback, enhanced }: ProgressiveEnhancementProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR and initial render, show the fallback
  if (!isClient) {
    return <>{fallback}</>;
  }

  // Once hydrated, show the enhanced version
  return <>{enhanced}</>;
}

interface NoScriptWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper that only shows content when JavaScript is disabled
 */
export function NoScriptWrapper({ children }: NoScriptWrapperProps) {
  return (
    <noscript>
      {children}
    </noscript>
  );
}

interface ScriptOnlyProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper that only shows content when JavaScript is enabled
 * Uses client-side state to avoid hydration mismatches
 */
export function ScriptOnly({ children, className }: ScriptOnlyProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
}