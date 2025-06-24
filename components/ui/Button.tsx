import { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
}

export function Button({ 
  variant = 'primary', 
  size = 'md',
  children, 
  className,
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = 'font-sans font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-charcoal text-white hover:bg-opacity-90 focus:ring-charcoal',
    secondary: 'bg-white text-charcoal border-2 border-charcoal hover:bg-charcoal hover:text-white focus:ring-charcoal',
    ghost: 'bg-transparent text-charcoal hover:bg-charcoal hover:bg-opacity-10 focus:ring-charcoal'
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const disabledStyles = 'opacity-50 cursor-not-allowed hover:bg-opacity-100';

  return (
    <button
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        disabled && disabledStyles,
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}