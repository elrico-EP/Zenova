import { Notification, NotificationType } from '../types';

/**
 * Toast notification - temporary UI feedback
 */
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number; // ms, default 5000
}

/**
 * Create a new notification
 */
export const createNotification = (
  type: NotificationType,
  title: string,
  message: string,
  recipientIds: string[],
  senderId: string,
  senderName: string,
  relatedData?: {
    date?: string;
    nurseId?: string;
    nurseName?: string;
  }
): Notification => {
  const now = new Date().toISOString();
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Set isRead to false for all recipients
  const isRead: Record<string, boolean> = {};
  recipientIds.forEach((id) => {
    isRead[id] = false;
  });

  return {
    id,
    type,
    recipientIds,
    senderId,
    senderName,
    title,
    message,
    timestamp: now,
    createdAt: now,
    isRead,
    emailSent: false,
    relatedDate: relatedData?.date,
    relatedNurseId: relatedData?.nurseId,
    relatedNurseName: relatedData?.nurseName,
  };
};

/**
 * Create a toast notification for shift change
 */
export const createShiftChangeToast = (nurseName: string, actionType: 'change' | 'swap' | 'delete'): Toast => {
  const actionText = {
    change: 'cambió',
    swap: 'intercambió',
    delete: 'eliminó',
  }[actionType];

  return {
    id: `toast_${Date.now()}`,
    type: 'info',
    message: `Turno de ${nurseName} ha sido ${actionText}`,
    duration: 5000,
  };
};

/**
 * Get notification display details
 */
export const getNotificationDisplay = (notification: Notification) => {
  const date = notification.relatedDate
    ? new Date(notification.relatedDate).toLocaleDateString('es-ES')
    : '';

  return {
    title: notification.title,
    message: notification.message,
    sender: notification.senderName,
    date,
    timestamp: new Date(notification.timestamp).toLocaleString('es-ES'),
    icon: getNotificationIcon(notification.type),
  };
};

/**
 * Get icon for notification type
 */
export const getNotificationIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    shift_change: '📝',
    shift_swap: '🔄',
    shift_delete: '❌',
    schedule_update: '📅',
    general: 'ℹ️',
  };
  return icons[type] || 'ℹ️';
};

/**
 * Format notification for email
 */
export const formatNotificationEmail = (notification: Notification): string => {
  const date = notification.relatedDate
    ? new Date(notification.relatedDate).toLocaleDateString('es-ES')
    : '';

  return `
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2c3e50;">${notification.title}</h2>
      <p><strong>Acción realizada por:</strong> ${notification.senderName}</p>
      <p><strong>Fecha:</strong> ${date}</p>
      <p><strong>Detalles:</strong> ${notification.message}</p>
      ${
        notification.relatedNurseName
          ? `<p><strong>Enfermero afectado:</strong> ${notification.relatedNurseName}</p>`
          : ''
      }
      <p style="color: #999; font-size: 12px;">
        Notificación enviada a las ${new Date(notification.timestamp).toLocaleTimeString('es-ES')}
      </p>
    </div>
  </body>
</html>
  `.trim();
};

/**
 * Send email notification (to be called with Supabase edge function or external service)
 */
export const sendNotificationEmail = async (
  notification: Notification,
  recipientEmail: string,
  recipientName: string
): Promise<boolean> => {
  try {
    // This will be called from the notification context when email sending is needed
    // For now, return true to indicate it would be sent
    // Implementation will depend on email service (Supabase functions, SendGrid, etc.)
    console.log(`Email would be sent to ${recipientEmail} for notification: ${notification.id}`);
    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
};
