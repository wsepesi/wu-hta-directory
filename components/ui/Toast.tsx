"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  const bgColor = {
    success: "bg-white border-charcoal",
    error: "bg-white border-red-600",
    info: "bg-white border-charcoal",
    warning: "bg-white border-yellow-600",
  }[toast.type];

  const iconColor = {
    success: "text-charcoal",
    error: "text-red-600",
    info: "text-charcoal",
    warning: "text-yellow-600",
  }[toast.type];

  const icon = {
    success: "✓",
    error: "✗",
    info: "i",
    warning: "!",
  }[toast.type];

  return (
    <div
      className={`max-w-sm w-full ${bgColor} border pointer-events-auto`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${iconColor}`}>
            <span className="text-lg font-serif">{icon}</span>
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-serif text-charcoal">{toast.title}</p>
            {toast.message && (
              <p className="mt-1 text-sm text-charcoal/60">{toast.message}</p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onDismiss(toast.id)}
              className="inline-flex text-charcoal/40 hover:text-charcoal/60"
            >
              <span className="sr-only">Close</span>
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

  if (typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 flex flex-col items-end justify-end px-4 py-6 pointer-events-none sm:p-6 z-50 space-y-4">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>,
    document.body
  );
}

// Helper function to show toast
export function showToast(
  type: ToastType,
  title: string,
  message?: string,
  duration: number = 5000
) {
  const toast: ToastMessage = {
    id: Math.random().toString(36).substr(2, 9),
    type,
    title,
    message,
    duration,
  };

  window.dispatchEvent(new CustomEvent("toast", { detail: toast }));
}