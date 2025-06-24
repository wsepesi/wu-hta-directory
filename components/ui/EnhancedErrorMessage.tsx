import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface ErrorMessageProps {
  title?: string;
  message: string;
  details?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'error' | 'warning' | 'info';
  className?: string;
  icon?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function EnhancedErrorMessage({
  title,
  message,
  details,
  action,
  variant = 'error',
  className,
  icon,
  dismissible = true,
  onDismiss,
}: ErrorMessageProps) {
  const variantStyles = {
    error: {
      container: 'bg-red-50 border-red-200',
      icon: 'text-red-400',
      title: 'text-red-800',
      message: 'text-red-700',
      details: 'text-red-600',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-400',
      title: 'text-yellow-800',
      message: 'text-yellow-700',
      details: 'text-yellow-600',
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-400',
      title: 'text-blue-800',
      message: 'text-blue-700',
      details: 'text-blue-600',
    },
  };

  const defaultIcons = {
    error: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  };

  const styles = variantStyles[variant];
  const defaultIcon = defaultIcons[variant];

  return (
    <div
      className={clsx(
        'rounded-lg border p-4',
        styles.container,
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex">
        <div className={clsx('flex-shrink-0', styles.icon)} aria-hidden="true">
          {icon || defaultIcon}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={clsx('text-sm font-medium', styles.title)}>
              {title}
            </h3>
          )}
          <div className={clsx('text-sm', styles.message, title && 'mt-1')}>
            {message}
          </div>
          {details && (
            <details className="mt-2">
              <summary className={clsx('text-sm cursor-pointer hover:underline', styles.details)}>
                Show details
              </summary>
              <pre className="mt-2 text-xs bg-white bg-opacity-50 rounded p-2 overflow-x-auto">
                {details}
              </pre>
            </details>
          )}
          {action && (
            <div className="mt-3">
              <button
                onClick={action.onClick}
                className={clsx(
                  'text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded',
                  styles.title
                )}
              >
                {action.label} →
              </button>
            </div>
          )}
        </div>
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className={clsx(
                'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                styles.icon,
                'hover:bg-white hover:bg-opacity-20'
              )}
              aria-label="Dismiss"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}