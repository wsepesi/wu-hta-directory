'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect if JavaScript is available for progressive enhancement
 * Returns false during SSR and initial render, true once hydrated
 */
export function useProgressiveEnhancement() {
  const [isEnhanced, setIsEnhanced] = useState(false);

  useEffect(() => {
    setIsEnhanced(true);
  }, []);

  return isEnhanced;
}

/**
 * Hook to progressively enhance form submissions
 * Provides fallback to standard form submission without JS
 */
export function useProgressiveForm<T extends Record<string, any>>({
  action,
  method = 'POST',
  onSubmit,
}: {
  action: string;
  method?: string;
  onSubmit?: (data: T) => Promise<void> | void;
}) {
  const isEnhanced = useProgressiveEnhancement();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // If not enhanced or no onSubmit handler, let the form submit normally
    if (!isEnhanced || !onSubmit) {
      return;
    }

    // Prevent default form submission for enhanced experience
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries()) as T;
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formProps: {
      action: isEnhanced ? undefined : action,
      method: isEnhanced ? undefined : method,
      onSubmit: handleSubmit,
    },
    isSubmitting,
    isEnhanced,
  };
}