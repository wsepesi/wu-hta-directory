"use client";

import { FormHTMLAttributes, ReactNode, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface ProgressiveAuthFormProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
  fallbackAction: string;
  enhancedOnSubmit?: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  onServerError?: (error: string, code?: string) => void;
  onServerSuccess?: (message: string, data?: Record<string, string>) => void;
}

/**
 * Progressive enhancement form wrapper specifically for authentication forms
 * Handles server-side errors and success messages from URL parameters
 */
export function ProgressiveAuthForm({ 
  children, 
  fallbackAction, 
  enhancedOnSubmit,
  onServerError,
  onServerSuccess,
  method = 'POST',
  ...props 
}: ProgressiveAuthFormProps) {
  const searchParams = useSearchParams();
  
  // Handle server-side responses
  useEffect(() => {
    const serverError = searchParams.get('error');
    const serverCode = searchParams.get('code');
    const serverSuccess = searchParams.get('success');
    
    if (serverError && onServerError) {
      onServerError(serverError, serverCode || undefined);
    }
    
    if (serverSuccess && onServerSuccess) {
      // Parse any additional data from search params
      const data: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        if (key !== 'success') {
          data[key] = value;
        }
      });
      onServerSuccess(serverSuccess, data);
    }
  }, [searchParams, onServerError, onServerSuccess]);

  // Check if JavaScript is available
  const isClient = typeof window !== 'undefined';
  
  // If no JavaScript, render a standard form
  if (!isClient || !enhancedOnSubmit) {
    return (
      <form 
        action={fallbackAction} 
        method={method}
        {...props}
      >
        {children}
        <noscript>
          <input type="hidden" name="_no_js" value="true" />
        </noscript>
      </form>
    );
  }

  // With JavaScript, use the enhanced handler
  return (
    <form 
      onSubmit={enhancedOnSubmit}
      {...props}
    >
      {children}
    </form>
  );
}