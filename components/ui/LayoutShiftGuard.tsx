import { ReactNode } from 'react';

interface LayoutShiftGuardProps {
  children: ReactNode;
  minHeight?: string | number;
  aspectRatio?: string;
  className?: string;
}

/**
 * Prevents layout shift by reserving space for content
 * Uses CSS aspect-ratio or min-height to maintain layout stability
 */
export function LayoutShiftGuard({
  children,
  minHeight,
  aspectRatio,
  className = '',
}: LayoutShiftGuardProps) {
  const style: React.CSSProperties = {};
  
  if (minHeight) {
    style.minHeight = typeof minHeight === 'number' ? `${minHeight}px` : minHeight;
  }
  
  if (aspectRatio) {
    style.aspectRatio = aspectRatio;
  }
  
  return (
    <div className={`relative ${className}`} style={style}>
      {children}
    </div>
  );
}