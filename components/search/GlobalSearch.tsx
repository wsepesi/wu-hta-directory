'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { BodyText } from '../ui/Typography';
import { clsx } from 'clsx';

interface SearchResult {
  id: string;
  type: 'ta' | 'course' | 'professor';
  title: string;
  subtitle?: string;
  url: string;
}

interface GlobalSearchProps {
  onSearch: (query: string) => Promise<SearchResult[]>;
  placeholder?: string;
  className?: string;
}

export function GlobalSearch({ 
  onSearch, 
  placeholder = 'Search for TAs, courses, or professors...',
  className 
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      setShowResults(false);
      return;
    }

    // Debounce search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const searchResults = await onSearch(query);
        setResults(searchResults);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, onSearch]);

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'ta':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'course':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'professor':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        );
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'ta': return 'TA';
      case 'course': return 'Course';
      case 'professor': return 'Professor';
    }
  };

  return (
    <div ref={searchRef} className={clsx('relative', className)}>
      <div className="relative">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowResults(true)}
          placeholder={placeholder}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <div className="w-5 h-5">
              <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {loading ? (
            // Search Results Skeleton
            <div className="py-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <Skeleton variant="circular" width={16} height={16} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Skeleton variant="text" width="60%" className="h-4" />
                      <Skeleton variant="rectangular" width={60} height={18} className="rounded" />
                    </div>
                    <Skeleton variant="text" width="40%" className="h-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <ul className="py-2">
              {results.map((result) => (
                <li key={result.id}>
                  <a
                    href={result.url}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowResults(false)}
                  >
                    <div className="flex-shrink-0 mt-0.5 text-gray-400">
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <BodyText className="font-medium text-sm truncate">
                          {result.title}
                        </BodyText>
                        <span className="flex-shrink-0 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {getTypeLabel(result.type)}
                        </span>
                      </div>
                      {result.subtitle && (
                        <BodyText className="text-xs text-gray-500 truncate">
                          {result.subtitle}
                        </BodyText>
                      )}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center">
              <BodyText className="text-sm text-gray-500">
                No results found for &quot;{query}&quot;
              </BodyText>
            </div>
          )}
        </div>
      )}
    </div>
  );
}