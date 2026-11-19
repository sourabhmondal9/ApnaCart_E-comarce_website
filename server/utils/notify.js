import Notification from '../models/Notification.js';
import { sendEmail } from './sendEmail.js';

export const notify = async ({ user, type, title, message, orderId }) => {
  const notification = await Notification.create({
    user: user._id,
    type,
    title,
    message,
    order: orderId || undefined,
  });

  if (user.email) {
    sendEmail({
      to: user.email,
      subject: title,
      text: `Hi ${user.name || 'there'},\n\n${message}\n\n— ApnaCart (Apni Pasand. Apni Shopping.)`,
    }).catch((err) => console.error('notify(): email send failed:', err.message));
  }

  return notification;
};
