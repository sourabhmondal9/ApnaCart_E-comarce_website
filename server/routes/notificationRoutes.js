import express from 'express';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // notifications are always scoped to the logged-in user

router.get('/', getMyNotifications);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);
router.delete('/:id', deleteNotification);

export default router;
