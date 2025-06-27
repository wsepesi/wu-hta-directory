'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { clsx } from 'clsx';

interface LazyImageProps extends Omit<ImageProps, 'onLoad'> {
  fallback?: string;
  className?: string;
  containerClassName?: string;
}

export function LazyImage({
  src,
  alt,
  fallback = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRTVFN0VCIi8+Cjwvc3ZnPg==',
  className,
  containerClassName,
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(fallback);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true,
  });

  useEffect(() => {
    if (isVisible && src) {
      setImageSrc(src as string);
    }
  }, [isVisible, src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setImageSrc(fallback);
  };

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={clsx('relative overflow-hidden', containerClassName)}
    >
      <Image
        {...props}
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={clsx(
          'transition-opacity duration-300',
          {
            'opacity-0': !isLoaded && !hasError,
            'opacity-100': isLoaded || hasError,
          },
          className
        )}
      />
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}