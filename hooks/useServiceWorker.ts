'use client';

import { useEffect } from 'react';
import { showToast } from '@/components/ui/EnhancedToast';

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration);

            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New update available
                    showToast('info', 'Update available!', {
                      message: 'A new version is available. Refresh to update.',
                      action: {
                        label: 'Refresh',
                        onClick: () => window.location.reload(),
                      },
                      duration: 10000,
                    });
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }
  }, []);
}