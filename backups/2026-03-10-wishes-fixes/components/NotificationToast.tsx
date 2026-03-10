import React from 'react';
import { useNotification } from '../contexts/NotificationContext';

export const NotificationToast: React.FC = () => {
  const { toasts } = useNotification();

  const getToastBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${getToastBackgroundColor(toast.type)} text-white px-4 py-3 rounded shadow-lg flex items-center gap-3 animate-pulse pointer-events-auto max-w-sm`}
        >
          <span className="text-lg font-bold">{getToastIcon(toast.type)}</span>
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      ))}
    </div>
  );
};
