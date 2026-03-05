import { useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { createNotification, createShiftChangeToast } from '../utils/notificationService';
import { NotificationType } from '../types';

interface TriggerNotificationOptions {
  type: NotificationType;
  title: string;
  message: string;
  recipientIds: string[];
  senderId: string;
  senderName: string;
  relatedDate?: string;
  relatedNurseId?: string;
  relatedNurseName?: string;
  showToast?: boolean;
  toastMessage?: string;
}

export const useNotificationTrigger = () => {
  const { addToast, addNotification } = useNotification();

  const trigger = useCallback((options: TriggerNotificationOptions) => {
    // Create and add notification
    const notification = createNotification(
      options.type,
      options.title,
      options.message,
      options.recipientIds,
      options.senderId,
      options.senderName,
      {
        date: options.relatedDate,
        nurseId: options.relatedNurseId,
        nurseName: options.relatedNurseName,
      }
    );

    addNotification(notification);

    // Show toast if requested
    if (options.showToast) {
      addToast({
        type: 'info',
        message: options.toastMessage || options.message,
        duration: 5000,
      });
    }
  }, [addNotification, addToast]);

  return { trigger };
};
