"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
  index: number;
}

function Toast({ toast, onDismiss, index }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 300);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, handleDismiss]);

  const bgColor = {
    success: "bg-white border-charcoal text-charcoal",
    error: "bg-white border-red-600 text-red-600",
    info: "bg-white border-charcoal text-charcoal",
    warning: "bg-white border-yellow-600 text-yellow-600",
  }[toast.type];

  const iconColor = {
    success: "text-charcoal",
    error: "text-red-600",
    info: "text-charcoal",
    warning: "text-yellow-600",
  }[toast.type];

  const icon = {
    success: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  }[toast.type];

  return (
    <div
      className={clsx(
        `max-w-sm w-full ${bgColor} border pointer-events-auto transform transition-opacity duration-300 ease-out`,
        {
          'translate-y-0 opacity-100': isVisible && !isLeaving,
          'translate-y-2 opacity-0': !isVisible || isLeaving,
        }
      )}
      style={{
        transform: `translateY(${index * -10}px)`,
      }}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${iconColor}`} aria-hidden="true">
            {icon}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-serif">{toast.title}</p>
            {toast.message && (
              <p className="mt-1 text-sm opacity-90">{toast.message}</p>
            )}
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="mt-2 text-sm font-serif underline hover:opacity-70 focus:outline-none focus:ring-1 focus:ring-charcoal focus:ring-offset-1"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleDismiss}
              className="inline-flex text-current opacity-60 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded transition-opacity duration-200"
              aria-label="Dismiss notification"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleToast = (event: CustomEvent<ToastMessage>) => {
      setToasts((prev) => [...prev, event.detail]);
    };

    window.addEventListener("toast" as keyof WindowEventMap, handleToast as EventListener);
    return () => window.removeEventListener("toast" as keyof WindowEventMap, handleToast as EventListener);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  if (!mounted || typeof window === "undefined") return null;

  return createPortal(
    <div 
      className="fixed inset-0 flex flex-col items-end justify-end px-4 py-6 pointer-events-none sm:p-6 z-50 space-y-4"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast, index) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismissToast} index={index} />
      ))}
    </div>,
    document.body
  );
}

// Helper function to show toast with enhanced options
export function showToast(
  type: ToastType,
  title: string,
  options?: {
    message?: string;
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }
) {
  const toast: ToastMessage = {
    id: Math.random().toString(36).substr(2, 9),
    type,
    title,
    message: options?.message,
    duration: options?.duration ?? 5000,
    action: options?.action,
  };

  window.dispatchEvent(new CustomEvent("toast", { detail: toast }));
}