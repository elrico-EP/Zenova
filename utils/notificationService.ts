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
 * Send email notification via Supabase Edge Function
 * 
 * This function calls a Supabase Edge Function to send emails.
 * You need to create the edge function in your Supabase project.
 * 
 * To create the edge function:
 * 1. Go to Supabase Dashboard → Edge Functions
 * 2. Create a new function called 'send-notification-email'
 * 3. Use a service like Resend, SendGrid, or SMTP
 * 
 * Example edge function code (with Resend):
 * 
 * import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
 * import { Resend } from 'npm:resend'
 * 
 * const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
 * 
 * serve(async (req) => {
 *   const { to, subject, html } = await req.json()
 *   const data = await resend.emails.send({
 *     from: 'Zenova <noreply@yourdomain.com>',
 *     to: [to],
 *     subject: subject,
 *     html: html,
 *   })
 *   return new Response(JSON.stringify(data), {
 *     headers: { 'Content-Type': 'application/json' },
 *   })
 * })
 */
export const sendNotificationEmail = async (
  notification: Notification,
  recipientEmail: string,
  recipientName: string,
  supabaseClient?: any // Pass supabase client if available
): Promise<boolean> => {
  try {
    const emailHtml = formatNotificationEmail(notification);
    const subject = `Zenova: ${notification.title}`;

    // If supabase client is provided, use edge function
    if (supabaseClient) {
      const { data, error } = await supabaseClient.functions.invoke('send-notification-email', {
        body: {
          to: recipientEmail,
          subject: subject,
          html: emailHtml,
        },
      });

      if (error) {
        console.error('Error calling Supabase edge function:', error);
        return false;
      }

      console.log(`✓ Email sent to ${recipientEmail}`);
      return true;
    } else {
      // Fallback: Log the email that would be sent
      console.log('📧 Email notification (Supabase not configured):');
      console.log(`To: ${recipientEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body (preview): ${notification.message}`);
      console.log('Configure Supabase Edge Function to send real emails.');
      return true;
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
};
