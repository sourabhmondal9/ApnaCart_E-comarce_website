import express from 'express';
import { getDashboardStats } from '../controllers/adminController.js';
import protect from '../middleware/authMiddleware.js';
import adminOnly from '../middleware/adminMiddleware.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);

export default router;
