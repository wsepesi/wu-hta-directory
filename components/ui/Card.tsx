import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
  hoverable?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, variant = 'primary', hoverable = false, onClick }: CardProps) {
  const variantStyles = {
    primary: 'bg-white border-charcoal',
    secondary: 'bg-white border-charcoal/50'
  };

  return (
    <div
      className={clsx(
        'p-6 border',
        variantStyles[variant],
        hoverable && 'transition-opacity duration-200 hover:opacity-80 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={clsx('mb-4', className)}>
      {children}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className }: CardBodyProps) {
  return (
    <div className={clsx('', className)}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={clsx('mt-4 pt-4 border-t border-charcoal/20', className)}>
      {children}
    </div>
  );
}