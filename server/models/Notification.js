import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = ['OrderPlaced', 'OrderStatusUpdated', 'General'];

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      default: 'General',
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    // Optional link back to the order this notification is about, so the
    // frontend can make it clickable straight to the order details page.
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: undefined,
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
