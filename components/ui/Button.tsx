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
  const baseStyles = 'font-serif font-normal transition-opacity duration-200 focus:outline-none focus:ring-1 focus:ring-charcoal focus:ring-offset-1';
  
  const variantStyles = {
    primary: 'text-charcoal border border-charcoal hover:opacity-70',
    secondary: 'text-charcoal border-b border-charcoal hover:opacity-70 pb-0.5',
    ghost: 'text-charcoal hover:opacity-70'
  };
  
  const sizeStyles = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-1.5 text-base',
    lg: 'px-4 py-2 text-lg'
  };
  
  const disabledStyles = 'opacity-40 cursor-not-allowed';

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