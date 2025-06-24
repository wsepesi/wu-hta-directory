import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface TypographyProps {
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'script' | 'serif';
  children: ReactNode;
  className?: string;
  as?: React.ElementType;
}

export function Typography({ variant, children, className, as }: TypographyProps) {
  const variantStyles = {
    h1: 'font-sans text-3xl md:text-4xl font-bold text-charcoal',
    h2: 'font-sans text-2xl md:text-3xl font-bold text-charcoal',
    h3: 'font-sans text-xl md:text-2xl font-semibold text-charcoal',
    h4: 'font-sans text-lg md:text-xl font-semibold text-charcoal',
    body: 'font-sans text-base text-charcoal leading-relaxed',
    small: 'font-sans text-sm text-charcoal',
    script: 'font-script text-4xl md:text-5xl lg:text-6xl font-semibold text-charcoal',
    serif: 'font-serif text-2xl md:text-3xl lg:text-4xl font-bold text-charcoal',
  };

  const defaultTags = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    body: 'p',
    small: 'p',
    script: 'h1',
    serif: 'h2',
  };

  const Component = as || defaultTags[variant] || 'div';

  return (
    <Component className={clsx(variantStyles[variant], className)}>
      {children}
    </Component>
  );
}

// Legacy exports for backward compatibility
export function ScriptHeading({ children, className }: { children: ReactNode; className?: string }) {
  return <Typography variant="script" className={className}>{children}</Typography>;
}

export function SerifHeading({ children, className }: { children: ReactNode; className?: string }) {
  return <Typography variant="serif" className={className}>{children}</Typography>;
}

export function BodyText({ children, className }: { children: ReactNode; className?: string }) {
  return <Typography variant="body" className={className}>{children}</Typography>;
}