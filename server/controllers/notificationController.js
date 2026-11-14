import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Notification from '../models/Notification.js';
import { validateObjectId } from '../validators/productValidators.js';

// @route GET /api/notifications — protected. Paginated, newest first.
export const getMyNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Notification.countDocuments({ user: req.user._id }),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 },
    },
  });
});

// @route PATCH /api/notifications/:id/read — protected. Owner only.
export const markNotificationRead = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'notification id');

  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) throw new ApiError(404, 'Notification not found');

  notification.isRead = true;
  await notification.save();

  res.status(200).json({ success: true, data: { notification } });
});

// @route PATCH /api/notifications/read-all — protected
export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

// @route DELETE /api/notifications/:id — protected. Owner only.
export const deleteNotification = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'notification id');
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!notification) throw new ApiError(404, 'Notification not found');
  res.status(200).json({ success: true, message: 'Notification deleted' });
});
