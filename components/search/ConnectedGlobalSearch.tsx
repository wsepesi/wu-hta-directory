'use client';

import { SearchWithHighlight } from './SearchWithHighlight';

interface ConnectedGlobalSearchProps {
  className?: string;
  placeholder?: string;
}

export function ConnectedGlobalSearch({ 
  className = 'w-full',
  placeholder = 'Search TAs, courses, or professors...'
}: ConnectedGlobalSearchProps) {
  return (
    <SearchWithHighlight 
      className={className}
      placeholder={placeholder}
    />
  );
}