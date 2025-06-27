'use client';

import { useRef, useState, useEffect, useCallback, ReactNode } from 'react';
import { clsx } from 'clsx';

interface VirtualListProps<T> {
  items: T[];
  height: number | string;
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  overscan?: number;
  className?: string;
  emptyComponent?: ReactNode;
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  keyExtractor,
  overscan = 3,
  className,
  emptyComponent,
}: VirtualListProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const totalHeight = items.length * itemHeight;
  const viewportHeight = typeof height === 'number' ? height : 0;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      setScrollTop(scrollContainerRef.current.scrollTop);
      setIsScrolling(true);

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set scrolling to false after scroll ends
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      
      // Get initial height if using percentage
      if (typeof height === 'string') {
        container.getBoundingClientRect();
        // Force re-render with calculated height
        container.style.height = height;
      }
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll, height]);

  if (items.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  return (
    <div
      ref={scrollContainerRef}
      className={clsx('overflow-auto', className)}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      role="list"
      aria-label="Scrollable list"
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            return (
              <div
                key={keyExtractor(item, actualIndex)}
                style={{
                  height: itemHeight,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: `translateY(${index * itemHeight}px)`,
                }}
                className={clsx(
                  'transition-opacity duration-150',
                  isScrolling && 'pointer-events-none'
                )}
                role="listitem"
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}