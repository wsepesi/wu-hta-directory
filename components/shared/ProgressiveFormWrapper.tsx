import { ReactNode } from 'react';

interface ProgressiveFormWrapperProps {
  children: ReactNode;
  enhancedContent: ReactNode;
  className?: string;
}

/**
 * A wrapper component that provides progressive enhancement for forms.
 * Shows the standard form when JavaScript is disabled, and enhanced content when JavaScript is enabled.
 * 
 * @param children - The form content that works without JavaScript
 * @param enhancedContent - The enhanced content that requires JavaScript
 * @param className - Optional className for the wrapper div
 */
export function ProgressiveFormWrapper({ 
  children, 
  enhancedContent, 
  className = '' 
}: ProgressiveFormWrapperProps) {
  return (
    <div className={className}>
      {/* Non-JS fallback: Standard form that submits */}
      <div className="no-js-only">
        {children}
      </div>

      {/* Enhanced version with client-side functionality */}
      <div className="js-only">
        {enhancedContent}
      </div>
    </div>
  );
}