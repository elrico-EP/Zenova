import { useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { createNotification, sendNotificationEmail } from '../utils/notificationService';
import { NotificationType, User, Nurse } from '../types';
import { supabase } from '../firebase/supabase-config';

const isDeliverableEmail = (email: string): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const isFormatOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  const isPlaceholder = normalized.endsWith('@example.com') || normalized.includes('yourdomain.com');
  return isFormatOk && !isPlaceholder;
};

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
  sendEmail?: boolean; // Whether to send email notification
  nurses?: Nurse[]; // Pass nurses list to get emails
  users?: User[]; // Pass users list to get emails
}

export const useNotificationTrigger = () => {
  const { addToast, addNotification } = useNotification();

  const trigger = useCallback(async (options: TriggerNotificationOptions) => {
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
        duration: 7000,
      });
    }

    // Send emails if requested
    if (options.sendEmail && (options.nurses || options.users)) {
      // Send emails in background (don't block UI)
      Promise.all(
        options.recipientIds.map(async (recipientId) => {
          // Try to find email in nurses list first
          let recipientEmail = '';
          let recipientName = '';

          if (options.nurses) {
            const nurse = options.nurses.find((n) => n.id === recipientId);
            if (nurse) {
              recipientEmail = nurse.email;
              recipientName = nurse.name;
            }
          }

          // If not found in nurses, try users list
          if (!recipientEmail && options.users) {
            const user = options.users.find((u) => u.id === recipientId || u.nurseId === recipientId);
            if (user) {
              recipientEmail = user.email;
              recipientName = user.name;
            }
          }

          // Send email if we found the recipient's email
          if (isDeliverableEmail(recipientEmail)) {
            await sendNotificationEmail(
              notification,
              recipientEmail,
              recipientName,
              supabase
            );
          } else {
            console.warn(`No valid deliverable email found for recipient ID: ${recipientId}`);
          }
        })
      ).catch((error) => {
        console.error('Error sending notification emails:', error);
      });
    }
  }, [addNotification, addToast]);

  return { trigger };
};
