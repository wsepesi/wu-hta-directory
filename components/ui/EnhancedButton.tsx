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
    const baseStyles = 'font-serif font-normal transition-opacity duration-200 focus:outline-none focus:ring-1 focus:ring-charcoal focus:ring-offset-1 inline-flex items-center justify-center';
    
    const variantStyles = {
      primary: 'text-charcoal border border-charcoal hover:opacity-70',
      secondary: 'text-charcoal border-b border-charcoal hover:opacity-70 pb-0.5',
      ghost: 'text-charcoal hover:opacity-70',
      danger: 'text-red-600 border border-red-600 hover:opacity-70'
    };
    
    const sizeStyles = {
      sm: 'px-2 py-1 text-sm gap-1.5',
      md: 'px-3 py-1.5 text-base gap-2',
      lg: 'px-4 py-2 text-lg gap-2.5'
    };
    
    const disabledStyles = 'opacity-40 cursor-not-allowed';
    const loadingStyles = 'cursor-wait';

    const isDisabled = disabled || loading;

    const LoadingIndicator = () => {
      const sizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4', 
        lg: 'w-5 h-5'
      };
      
      return (
        <div className={clsx(
          'rounded-full bg-current animate-pulse',
          sizeClasses[size]
        )} />
      );
    };

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
        {loading && iconPosition === 'left' && <LoadingIndicator />}
        {!loading && icon && iconPosition === 'left' && icon}
        <span>{loading && loadingText ? loadingText : children}</span>
        {loading && iconPosition === 'right' && <LoadingIndicator />}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';