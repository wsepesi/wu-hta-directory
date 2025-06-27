import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface ErrorMessageProps {
  children?: ReactNode;
  message?: string;
  className?: string;
  variant?: 'error' | 'warning' | 'info';
}

export function ErrorMessage({ 
  children, 
  message,
  className,
  variant = 'error' 
}: ErrorMessageProps) {
  const variantStyles = {
    error: 'bg-white border-red-600 text-red-600',
    warning: 'bg-white border-yellow-600 text-yellow-600',
    info: 'bg-white border-charcoal text-charcoal'
  };

  const iconPaths = {
    error: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  };

  return (
    <div
      className={clsx(
        'border p-4 flex items-start gap-3',
        variantStyles[variant],
        className
      )}
      role="alert"
    >
      <svg
        className="w-5 h-5 flex-shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={iconPaths[variant]}
        />
      </svg>
      <div className="flex-1 text-sm font-serif">
        {message || children}
      </div>
    </div>
  );
}