import { ReactNode } from 'react';
import { ScriptHeading, BodyText } from '../ui/Typography';
import { clsx } from 'clsx';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function Header({ title, subtitle, actions, className }: HeaderProps) {
  return (
    <header className={clsx('bg-white border-b border-gray-100', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <ScriptHeading className="text-3xl md:text-4xl mb-2">
              {title}
            </ScriptHeading>
            {subtitle && (
              <BodyText className="text-gray-600">
                {subtitle}
              </BodyText>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-4">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}