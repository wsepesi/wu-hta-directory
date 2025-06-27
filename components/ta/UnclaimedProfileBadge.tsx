'use client';

import { useSession } from 'next-auth/react';

interface UnclaimedProfileBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function UnclaimedProfileBadge({
  size = 'md',
  showText = true,
  className = '',
}: UnclaimedProfileBadgeProps) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-serif text-charcoal-500 bg-charcoal-50 border border-charcoal-200 rounded-full ${sizeClasses[size]} ${className}`}
      title={isAuthenticated ? 'This profile is unclaimed - click to claim it' : 'This profile is unclaimed'}
    >
      <svg
        className={`${iconSizes[size]} text-charcoal-400`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {showText && <span>Unclaimed</span>}
    </span>
  );
}