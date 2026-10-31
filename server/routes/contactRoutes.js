import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  submitContactMessage,
  getContactMessages,
  setMessageResolved,
  deleteContactMessage,
} from '../controllers/contactController.js';
import protect from '../middleware/authMiddleware.js';
import adminOnly from '../middleware/adminMiddleware.js';
import optionalAuth from '../middleware/optionalAuthMiddleware.js';

const router = express.Router();

// Prevent the public contact form from being used to spam the DB
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages sent, please try again later' },
});

router.post('/', contactLimiter, optionalAuth, submitContactMessage);
router.get('/', protect, adminOnly, getContactMessages);
router.patch('/:id/resolve', protect, adminOnly, setMessageResolved);
router.delete('/:id', protect, adminOnly, deleteContactMessage);

export default router;
