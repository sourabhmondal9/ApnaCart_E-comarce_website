import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Order, { ORDER_STATUSES } from '../models/Order.js';
import User from '../models/User.js';
import { validateShippingAddress } from '../validators/orderValidators.js';
import { validateObjectId } from '../validators/productValidators.js';
import { notify } from '../utils/notify.js';

const ALLOWED_TRANSITIONS = {
  Placed: ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

/*
 * Throws ApiError(400, ...) on any problem. Returns { cart, orderItems,
 * totalAmount } on success.
 */
const buildOrderItemsFromCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Your cart is empty');
  }

  const productIds = cart.items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const orderItems = [];
  let totalAmount = 0;

  for (const item of cart.items) {
    const product = productMap.get(item.product.toString());
    if (!product || !product.isActive) {
      throw new ApiError(400, 'A product in your cart is no longer available. Please update your cart.');
    }
    if (item.quantity > product.stock) {
      throw new ApiError(400, `Insufficient stock for "${product.name}". Only ${product.stock} left.`);
    }
    const price = product.price;
    totalAmount += price * item.quantity;
    orderItems.push({
      product: product._id,
      name: product.name,
      price,
      quantity: item.quantity,
    });
  }

  totalAmount = Math.round(totalAmount * 100) / 100;
  return { cart, orderItems, totalAmount };
};

const commitOrder = async ({ user, cart, orderItems, totalAmount, shippingAddress, paymentMethod, paymentStatus, extraFields = {} }) => {
  const userId = user._id;
  let session = null;
  let useTransaction = true;
  let createdOrder = null;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    for (const item of orderItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true, session }
      );
      if (!updated) {
        throw new ApiError(400, `Insufficient stock for "${item.name}". Please update your cart.`);
      }
    }

    const [order] = await Order.create(
      [
        {
          user: userId,
          items: orderItems,
          shippingAddress,
          totalAmount,
          paymentMethod,
          paymentStatus,
          orderStatus: 'Placed',
          ...extraFields,
        },
      ],
      { session }
    );

    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    createdOrder = order;
  } catch (err) {
    if (session) await session.abortTransaction().catch(() => {});

    const isTransactionsUnsupported =
      err.message && /Transaction numbers|replica set|transactions are not supported/i.test(err.message);

    if (!isTransactionsUnsupported) throw err; // a real validation/stock error — surface it as-is
    useTransaction = false;
  } finally {
    if (session) session.endSession();
  }

  if (!useTransaction) {
    const decremented = [];
    try {
      for (const item of orderItems) {
        const updated = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
        if (!updated) {
          throw new ApiError(400, `Insufficient stock for "${item.name}". Please update your cart.`);
        }
        decremented.push(item);
      }

      createdOrder = await Order.create({
        user: userId,
        items: orderItems,
        shippingAddress,
        totalAmount,
        paymentMethod,
        paymentStatus,
        orderStatus: 'Placed',
        ...extraFields,
      });

      cart.items = [];
      await cart.save();
    } catch (err) {
      // Roll back any stock we already decremented before the failure
      for (const item of decremented) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
      throw err;
    }
  }

  // Notify the customer their order was placed — always
  const orderNumber = createdOrder._id.toString().slice(-8).toUpperCase();
  await notify({
    user,
    type: 'OrderPlaced',
    title: `Order #${orderNumber} placed successfully`,
    message: `Thanks for your order! Order #${orderNumber} for a total of Rs. ${totalAmount.toFixed(2)} has been placed and is now "Placed". You'll be notified as its status updates.`,
    orderId: createdOrder._id,
  }).catch((err) => console.error('Order-placed notification failed:', err.message));

  return { order: createdOrder, usedTransaction: useTransaction };
};

// @route POST /api/orders — Cash on Delivery.
export const createOrder = asyncHandler(async (req, res) => {
  validateShippingAddress(req.body.shippingAddress);
  const { shippingAddress } = req.body;

  const { cart, orderItems, totalAmount } = await buildOrderItemsFromCart(req.user._id);

  const { order, usedTransaction } = await commitOrder({
    user: req.user,
    cart,
    orderItems,
    totalAmount,
    shippingAddress,
    paymentMethod: 'COD',
    paymentStatus: 'Pending',
  });

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: { order, usedTransaction },
  });
});

// @route GET /api/orders/my-orders
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: { orders } });
});

// @route GET /api/orders/:id — owner or admin only.
export const getOrderById = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'order id');
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');

  const isOwner = order.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'You do not have access to this order');
  }

  res.status(200).json({ success: true, data: { order } });
});

// @route GET /api/orders — admin only.
export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 15 } = req.query;
  const query = {};
  if (status) {
    if (!ORDER_STATUSES.includes(status)) throw new ApiError(400, 'Invalid order status filter');
    query.orderStatus = status;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(query).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Order.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      orders,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 },
    },
  });
});

// @route PATCH /api/orders/:id/status — admin only
export const updateOrderStatus = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'order id');
  const { status } = req.body;

  if (!ORDER_STATUSES.includes(status)) {
    throw new ApiError(400, 'Invalid order status');
  }

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  const allowedNext = ALLOWED_TRANSITIONS[order.orderStatus] || [];
  if (!allowedNext.includes(status)) {
    throw new ApiError(400, `Cannot change order status from "${order.orderStatus}" to "${status}"`);
  }

  if (status === 'Cancelled' && !order.stockRestored) {
    for (const item of order.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }
    order.stockRestored = true;
  }

  if (status === 'Delivered') {
    order.paymentStatus = order.paymentMethod === 'COD' ? 'Paid' : order.paymentStatus;
  }

  order.orderStatus = status;
  await order.save();

  // Notify the customer of the status change.
  const customer = await User.findById(order.user).select('name email');
  if (customer) {
    const orderNumber = order._id.toString().slice(-8).toUpperCase();
    await notify({
      user: customer,
      type: 'OrderStatusUpdated',
      title: `Order #${orderNumber} is now "${status}"`,
      message: `Your order #${orderNumber} status has been updated to "${status}".`,
      orderId: order._id,
    }).catch((err) => console.error('Order-status notification failed:', err.message));
  }

  res.status(200).json({ success: true, message: `Order marked as ${status}`, data: { order } });
});

export { buildOrderItemsFromCart, commitOrder };
