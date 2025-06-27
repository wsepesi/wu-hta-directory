import { ReactNode } from 'react';

interface CleanLayoutProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  center?: boolean;
}

const maxWidthClasses = {
  'sm': 'max-w-sm',
  'md': 'max-w-md',
  'lg': 'max-w-lg',
  'xl': 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
};

const paddingClasses = {
  'sm': 'px-4 py-8',
  'md': 'px-6 py-12',
  'lg': 'px-8 py-16',
  'xl': 'px-10 py-20',
};

/**
 * CleanLayout component provides consistent clean styling pattern
 * with white background, centered container, and consistent spacing.
 * 
 * @param children - Content to be wrapped
 * @param className - Additional classes for the outer container
 * @param contentClassName - Additional classes for the content wrapper
 * @param maxWidth - Maximum width of the content (default: '4xl')
 * @param padding - Padding size (default: 'lg')
 * @param center - Whether to center the content (default: false)
 */
export default function CleanLayout({
  children,
  className = '',
  contentClassName = '',
  maxWidth = '4xl',
  padding = 'lg',
  center = false,
}: CleanLayoutProps) {
  const containerClasses = `min-h-screen bg-white ${className}`.trim();
  const wrapperClasses = `${maxWidthClasses[maxWidth]} mx-auto ${paddingClasses[padding]} ${contentClassName}`.trim();
  const contentClasses = center ? 'text-center' : '';

  return (
    <div className={containerClasses}>
      <div className={wrapperClasses}>
        {center ? (
          <div className={contentClasses}>
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

/**
 * Variant specifically for page headers with serif font
 */
export function CleanPageHeader({
  title,
  subtitle,
  description,
  className = '',
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`font-serif text-charcoal mb-16 space-y-6 ${className}`.trim()}>
      {title && (
        <h1 className="text-4xl font-normal leading-tight">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="text-xl leading-relaxed">
          <em>{subtitle}</em>
        </p>
      )}
      {description && (
        <p className="text-lg leading-relaxed max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Navigation component with clean styling
 */
export function CleanNavigation({
  links,
  className = '',
  vertical = false,
}: {
  links: { href: string; label: string }[];
  className?: string;
  vertical?: boolean;
}) {
  const navClasses = vertical
    ? 'font-serif space-y-4'
    : 'font-serif space-y-4 sm:space-y-0 sm:space-x-12 sm:flex sm:justify-center';

  return (
    <nav className={`${navClasses} ${className}`.trim()}>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="block sm:inline text-sm uppercase tracking-wider text-charcoal hover:opacity-70 transition-opacity duration-200"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}