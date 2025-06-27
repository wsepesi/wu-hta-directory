'use client';

import { useProgressiveEnhancement } from '@/hooks/useProgressiveEnhancement';
import { ReactNode } from 'react';

interface ProgressiveFormProps {
  action: string;
  method?: 'GET' | 'POST';
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  children: ReactNode;
  className?: string;
  encType?: string;
}

/**
 * Progressive enhancement form wrapper
 * - Works as a regular HTML form without JavaScript
 * - Enhances to client-side handling when JavaScript is available
 */
export function ProgressiveForm({
  action,
  method = 'POST',
  onSubmit,
  children,
  className,
  encType,
}: ProgressiveFormProps) {
  const isEnhanced = useProgressiveEnhancement();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // If enhanced and onSubmit provided, prevent default and use custom handler
    if (isEnhanced && onSubmit) {
      e.preventDefault();
      await onSubmit(e);
    }
    // Otherwise, let the form submit normally
  };

  return (
    <form
      action={action}
      method={method}
      onSubmit={handleSubmit}
      className={className}
      encType={encType}
      noValidate={isEnhanced} // Disable browser validation when enhanced
    >
      {children}
    </form>
  );
}