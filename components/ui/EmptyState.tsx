import { ReactNode } from 'react';
import { Button } from './Button';
import { clsx } from 'clsx';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizeStyles = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
  };

  const iconSizeStyles = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const titleSizeStyles = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  const defaultIcon = (
    <svg
      className={clsx(iconSizeStyles[size], 'text-gray-400')}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );

  return (
    <div
      className={clsx(
        'text-center',
        sizeStyles[size],
        className
      )}
    >
      <div className="mx-auto flex items-center justify-center mb-4">
        {icon || defaultIcon}
      </div>
      <h3 className={clsx('font-medium text-gray-900 mb-2', titleSizeStyles[size])}>
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant={action.variant || 'primary'}
          onClick={action.onClick}
          size={size === 'lg' ? 'md' : 'sm'}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}