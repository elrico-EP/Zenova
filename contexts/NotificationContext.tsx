import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
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
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'LOAD_NOTIFICATIONS'; notifications: Notification[] };

interface State {
  toasts: Toast[];
  notifications: Notification[];
}

const initialState: State = {
  toasts: [],
  notifications: [],
};

const normalizeNotification = (raw: any): Notification | null => {
  if (!raw || typeof raw !== 'object') return null;

  const recipientIds = Array.isArray(raw.recipientIds)
    ? raw.recipientIds.filter((id: unknown) => typeof id === 'string')
    : [];

  if (!raw.id || recipientIds.length === 0) return null;

  const isReadRecord = raw.isRead && typeof raw.isRead === 'object' ? raw.isRead : {};

  return {
    id: String(raw.id),
    type: raw.type || 'general',
    recipientIds,
    senderId: String(raw.senderId || 'system'),
    senderName: String(raw.senderName || 'Sistema'),
    title: String(raw.title || 'Notificación'),
    message: String(raw.message || ''),
    relatedDate: raw.relatedDate,
    relatedNurseId: raw.relatedNurseId,
    relatedNurseName: raw.relatedNurseName,
    timestamp: String(raw.timestamp || new Date().toISOString()),
    isRead: isReadRecord,
    emailSent: raw.emailSent,
    createdAt: raw.createdAt,
  };
};

// Load notifications from localStorage
const loadNotificationsFromStorage = (): Notification[] => {
  try {
    const stored = localStorage.getItem('nursingAppNotifications');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => normalizeNotification(item))
        .filter((item): item is Notification => Boolean(item));
    }
  } catch (error) {
    console.error('Failed to load notifications from localStorage:', error);
  }
  return [];
};

// Save notifications to localStorage
const saveNotificationsToStorage = (notifications: Notification[]) => {
  try {
    localStorage.setItem('nursingAppNotifications', JSON.stringify(notifications));
  } catch (error) {
    console.error('Failed to save notifications to localStorage:', error);
  }
};

const notificationReducer = (state: State, action: Action): State => {
  let newState = state;
  
  switch (action.type) {
    case 'ADD_TOAST':
      newState = {
        ...state,
        toasts: [...state.toasts, action.toast],
      };
      break;

    case 'REMOVE_TOAST':
      newState = {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };
      break;

    case 'ADD_NOTIFICATION':
      newState = {
        ...state,
        notifications: [action.notification, ...state.notifications].slice(0, 50), // Keep last 50
      };
      saveNotificationsToStorage(newState.notifications);
      break;

    case 'MARK_AS_READ':
      newState = {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.notificationId
            ? {
                ...n,
                isRead: { ...(n.isRead || {}), [action.userId]: true },
              }
            : n
        ),
      };
      saveNotificationsToStorage(newState.notifications);
      break;

    case 'REMOVE_NOTIFICATION':
      newState = {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.id),
      };
      saveNotificationsToStorage(newState.notifications);
      break;

    case 'CLEAR_NOTIFICATIONS':
      newState = {
        ...state,
        notifications: [],
      };
      saveNotificationsToStorage(newState.notifications);
      break;
      
    case 'LOAD_NOTIFICATIONS':
      newState = {
        ...state,
        notifications: action.notifications,
      };
      break;

    default:
      newState = state;
  }
  
  return newState;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const storedNotifications = loadNotificationsFromStorage();
    if (storedNotifications.length > 0) {
      dispatch({ type: 'LOAD_NOTIFICATIONS', notifications: storedNotifications });
    }
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const toastWithId: Toast = {
      ...toast,
      id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    dispatch({ type: 'ADD_TOAST', toast: toastWithId });

    // Auto-remove toast after duration
    const duration = toast.duration || 7000;
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
      return state.notifications.filter((n) => n.recipientIds.includes(userId) && !(n.isRead?.[userId] ?? false)).length;
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
