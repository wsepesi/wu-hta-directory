import { showToast } from '@/components/ui/EnhancedToast';

export const toast = {
  success: (title: string, options?: { message?: string; duration?: number }) => {
    showToast('success', title, options);
  },
  error: (title: string, options?: { message?: string; duration?: number }) => {
    showToast('error', title, options);
  },
  info: (title: string, options?: { message?: string; duration?: number }) => {
    showToast('info', title, options);
  },
  warning: (title: string, options?: { message?: string; duration?: number }) => {
    showToast('warning', title, options);
  },
};