import Notification from '../models/Notification.js';
import { sendEmail } from './sendEmail.js';

/**
 * Creates an in-app notification for a user and, if SMTP is configured,
 * fires an email alongside it. The DB write is awaited (it's cheap and
 * should never silently fail to appear in the bell dropdown); the email
 * send is fire-and-forget so a slow or misconfigured mail server can
 * never delay an order placement or status update response.
 *
 * `user` should be at least { _id, email, name } — callers in
 * orderController already have req.user, so no extra DB query is needed.
 */
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
      text: `Hi ${user.name || 'there'},\n\n${message}\n\n— ApnaMart (Apni Pasand. Apni Shopping.)`,
    }).catch((err) => console.error('notify(): email send failed:', err.message));
  }

  return notification;
};
