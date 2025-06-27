import { FormHTMLAttributes, ReactNode } from 'react';
import { ProgressiveEnhancement } from '@/components/ui/ProgressiveEnhancement';

interface ProgressiveFormProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
  fallbackAction?: string;
  enhancedOnSubmit?: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
}

/**
 * Progressive form wrapper that works with or without JavaScript
 * Falls back to standard form submission when JS is disabled
 */
export function ProgressiveForm({ 
  children, 
  fallbackAction, 
  enhancedOnSubmit,
  action,
  method = 'POST',
  ...props 
}: ProgressiveFormProps) {
  // When JavaScript is available, use the enhanced submit handler
  const handleSubmit = enhancedOnSubmit || (() => {
    // Let the form submit naturally if no enhanced handler
    return true;
  });

  return (
    <ProgressiveEnhancement
      fallback={
        <form 
          action={fallbackAction || action} 
          method={method}
          {...props}
        >
          {children}
          <noscript>
            <input type="hidden" name="_no_js" value="true" />
          </noscript>
        </form>
      }
    >
      <form 
        onSubmit={handleSubmit}
        {...props}
      >
        {children}
      </form>
    </ProgressiveEnhancement>
  );
}