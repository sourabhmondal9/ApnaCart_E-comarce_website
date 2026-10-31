import express from 'express';
import { createRazorpayOrder, verifyRazorpayPayment } from '../controllers/paymentController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // online payment requires a logged-in customer

router.post('/razorpay/order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);

export default router;
