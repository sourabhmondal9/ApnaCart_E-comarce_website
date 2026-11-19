import crypto from 'crypto';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { getRazorpayInstance } from '../config/razorpay.js';
import { validateShippingAddress } from '../validators/orderValidators.js';
import { buildOrderItemsFromCart, commitOrder } from './orderController.js';

//  @route POST /api/payments/razorpay/order
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { totalAmount } = await buildOrderItemsFromCart(req.user._id);

  if (totalAmount <= 0) {
    throw new ApiError(400, 'Cart total must be greater than zero to pay online');
  }

  const razorpay = getRazorpayInstance();
  const amountInPaise = Math.round(totalAmount * 100);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `rcpt_${req.user._id.toString().slice(-8)}_${Date.now()}`,
    notes: { userId: req.user._id.toString() },
  });

  res.status(201).json({
    success: true,
    data: {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount, // in paise, echoed back for the widget
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // publishable; safe to expose
    },
  });
});

// @route POST /api/payments/razorpay/verify
export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, shippingAddress } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, 'Missing payment verification fields');
  }
  validateShippingAddress(shippingAddress);

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new ApiError(500, 'Razorpay is not configured on the server');
  }

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, 'Payment verification failed: invalid signature');
  }

  // Confirm the amount actually paid matches.
  const razorpay = getRazorpayInstance();
  const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);

  const { cart, orderItems, totalAmount } = await buildOrderItemsFromCart(req.user._id);
  const expectedAmountInPaise = Math.round(totalAmount * 100);

  if (razorpayOrder.amount !== expectedAmountInPaise) {
    throw new ApiError(400, 'Payment amount does not match the current cart total. Please retry checkout.');
  }

  const { order, usedTransaction } = await commitOrder({
    user: req.user,
    cart,
    orderItems,
    totalAmount,
    shippingAddress,
    paymentMethod: 'Online',
    paymentStatus: 'Paid',
    extraFields: {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Payment verified and order placed successfully',
    data: { order, usedTransaction },
  });
});
