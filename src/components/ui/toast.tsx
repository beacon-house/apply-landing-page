import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'error';
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'fixed bottom-4 right-4 z-50 rounded-lg shadow-lg p-4 min-w-[200px] transform transition-all duration-300 ease-in-out',
          variant === 'success' && 'bg-green-100 text-green-800',
          variant === 'error' && 'bg-red-100 text-red-800',
          variant === 'default' && 'bg-white text-gray-800',
          className
        )}
        {...props}
      />
    );
  }
);
Toast.displayName = 'Toast';

let toastTimeoutId: number;

const showToast = (message: string, variant: ToastProps['variant'] = 'default') => {
  // Remove existing toast if present
  const existingToast = document.querySelector('[data-toast]');
  if (existingToast) {
    existingToast.remove();
  }

  // Clear existing timeout
  if (toastTimeoutId) {
    window.clearTimeout(toastTimeoutId);
  }

  // Create new toast
  const toast = document.createElement('div');
  toast.setAttribute('data-toast', '');
  toast.className = cn(
    'fixed bottom-4 right-4 z-50 rounded-lg shadow-lg p-4 min-w-[200px] transform transition-all duration-300 ease-in-out',
    variant === 'success' && 'bg-green-100 text-green-800',
    variant === 'error' && 'bg-red-100 text-red-800',
    variant === 'default' && 'bg-white text-gray-800'
  );
  toast.textContent = message;

  // Add to DOM
  document.body.appendChild(toast);

  // Remove after delay
  toastTimeoutId = window.setTimeout(() => {
    toast.remove();
  }, 3000);
};

export const toast = {
  show: (message: string) => showToast(message),
  success: (message: string) => showToast(message, 'success'),
  error: (message: string) => showToast(message, 'error'),
};

export { Toast };