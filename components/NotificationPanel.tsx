import React, { useRef, useEffect, useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { getNotificationDisplay } from '../utils/notificationService';

interface NotificationPanelProps {
  userId: string;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ userId }) => {
  const { notifications, markAsRead, removeNotification, getUnreadCount } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = getUnreadCount(userId);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const userNotifications = notifications.filter((n) => Array.isArray(n.recipientIds) && n.recipientIds.includes(userId));

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId, userId);
  };

  const handleRemoveNotification = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    removeNotification(notificationId);
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors"
        title="Notificaciones"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Notificaciones</h3>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">
                {unreadCount} {unreadCount === 1 ? 'notificación nueva' : 'notificaciones nuevas'}
              </p>
            )}
          </div>

          {userNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {userNotifications.map((notification) => {
                const display = getNotificationDisplay(notification);
                const isRead = Boolean(notification.isRead?.[userId]);

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isRead ? 'bg-gray-50 hover:bg-gray-100' : 'bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{display.icon}</span>
                          <h4 className={`font-semibold ${isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                            {display.title}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{display.message}</p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>Por: {display.sender}</span>
                          <span>{display.date}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleRemoveNotification(e, notification.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
