'use client';

import { useState, useEffect, useRef } from 'react';
import { ConnectedGlobalSearch } from './ConnectedGlobalSearch';
import { useRouter } from 'next/navigation';

interface ProgressiveGlobalSearchProps {
  action?: string;
  method?: string;
  className?: string;
  placeholder?: string;
}

/**
 * Progressive enhancement wrapper for global search
 * - Works as a regular form without JavaScript
 * - Enhances to live search when JavaScript is available
 */
export function ProgressiveGlobalSearch({ 
  action = '/search',
  method = 'GET',
  className,
  placeholder = 'Search for TAs, courses, or professors...'
}: ProgressiveGlobalSearchProps) {
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Only enhance after hydration is complete
    setIsEnhanced(true);
  }, []);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isEnhanced) {
      e.preventDefault();
      // Navigate programmatically to maintain SPA behavior
      const formData = new FormData(e.currentTarget);
      const query = formData.get('q') as string;
      if (query) {
        router.push(`${action}?q=${encodeURIComponent(query)}`);
      }
    }
    // If not enhanced, let the form submit normally
  };

  if (isEnhanced) {
    // Once JavaScript is loaded, show the enhanced search
    return <ConnectedGlobalSearch />;
  }

  // Server-side and pre-hydration: show a standard form
  return (
    <form 
      ref={formRef}
      action={action} 
      method={method} 
      className={className}
      onSubmit={handleFormSubmit}
    >
      <div className="relative">
        <input
          type="search"
          name="q"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 pr-10 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          required
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {/* Submit button - only visible without JS, hidden when JS loads */}
        <button 
          type="submit" 
          className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors ${
            isEnhanced ? 'sr-only' : ''
          }`}
          aria-label="Search"
        >
          Search
        </button>
      </div>
    </form>
  );
}