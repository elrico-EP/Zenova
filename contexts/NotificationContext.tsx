import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { Notification } from '../types';
import { Toast } from '../utils/notificationService';

interface NotificationContextType {
  toasts: Toast[];
  notifications: Notification[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string, userId: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  getUnreadCount: (userId: string) => number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

type Action =
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'ADD_NOTIFICATION'; notification: Notification }
  | { type: 'MARK_AS_READ'; notificationId: string; userId: string }
  | { type: 'REMOVE_NOTIFICATION'; id: string }
  | { type: 'CLEAR_NOTIFICATIONS' };

interface State {
  toasts: Toast[];
  notifications: Notification[];
}

const initialState: State = {
  toasts: [],
  notifications: [],
};

const notificationReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.toast],
      };

    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.notification, ...state.notifications].slice(0, 50), // Keep last 50
      };

    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.notificationId
            ? {
                ...n,
                isRead: { ...n.isRead, [action.userId]: true },
              }
            : n
        ),
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.id),
      };

    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      };

    default:
      return state;
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const toastWithId: Toast = {
      ...toast,
      id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    dispatch({ type: 'ADD_TOAST', toast: toastWithId });

    // Auto-remove toast after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', id: toastWithId.id });
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', id });
  }, []);

  const addNotification = useCallback((notification: Notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', notification });
  }, []);

  const markAsRead = useCallback((notificationId: string, userId: string) => {
    dispatch({ type: 'MARK_AS_READ', notificationId, userId });
  }, []);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', id });
  }, []);

  const clearNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  }, []);

  const getUnreadCount = useCallback(
    (userId: string) => {
      return state.notifications.filter((n) => !n.isRead[userId]).length;
    },
    [state.notifications]
  );

  const value: NotificationContextType = {
    toasts: state.toasts,
    notifications: state.notifications,
    addToast,
    removeToast,
    addNotification,
    markAsRead,
    removeNotification,
    clearNotifications,
    getUnreadCount,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
