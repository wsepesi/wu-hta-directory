import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export const EnhancedButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md',
    children, 
    className,
    disabled,
    loading = false,
    loadingText,
    icon,
    iconPosition = 'left',
    type = 'button',
    ...props 
  }, ref) => {
    const baseStyles = 'font-sans font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center';
    
    const variantStyles = {
      primary: 'bg-charcoal text-white hover:bg-opacity-90 focus:ring-charcoal',
      secondary: 'bg-white text-charcoal border-2 border-charcoal hover:bg-charcoal hover:text-white focus:ring-charcoal',
      ghost: 'bg-transparent text-charcoal hover:bg-charcoal hover:bg-opacity-10 focus:ring-charcoal',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
    };
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5'
    };
    
    const disabledStyles = 'opacity-50 cursor-not-allowed hover:bg-opacity-100';
    const loadingStyles = 'cursor-wait';

    const isDisabled = disabled || loading;

    const LoadingSpinner = () => (
      <svg 
        className={clsx('animate-spin', {
          'h-3 w-3': size === 'sm',
          'h-4 w-4': size === 'md',
          'h-5 w-5': size === 'lg',
        })}
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <button
        ref={ref}
        type={type}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          isDisabled && disabledStyles,
          loading && loadingStyles,
          className
        )}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && iconPosition === 'left' && <LoadingSpinner />}
        {!loading && icon && iconPosition === 'left' && icon}
        <span>{loading && loadingText ? loadingText : children}</span>
        {loading && iconPosition === 'right' && <LoadingSpinner />}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';