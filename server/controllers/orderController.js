import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Order, { ORDER_STATUSES } from '../models/Order.js';
import { validateShippingAddress } from '../validators/orderValidators.js';
import { validateObjectId } from '../validators/productValidators.js';

// Allowed forward transitions. 'Cancelled' is reachable from any
// non-terminal state; terminal states cannot be changed further.
const ALLOWED_TRANSITIONS = {
  Placed: ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

/**
 * Reads the user's cart fresh from the DB and validates every line against
 * CURRENT product data (price, stock, active status). Never trusts
 * anything the client claims about prices or totals. Shared by both the
 * COD flow and the Razorpay verification flow so stock/price rules are
 * enforced identically regardless of payment method.
 *
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
    const price = product.price; // server-side snapshot, never client-supplied
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

/**
 * Decrements stock and creates the Order document, using a MongoDB
 * transaction when the deployment supports replica-set transactions
 * (Atlas, or a local replica set), and falling back to a sequential,
 * conditional-update approach on standalone MongoDB (common in local
 * college dev setups) that still prevents overselling. Clears the cart
 * only after the order is successfully persisted. `extraFields` lets
 * callers attach payment-method-specific data (e.g. Razorpay IDs).
 */
const commitOrder = async ({ userId, cart, orderItems, totalAmount, shippingAddress, paymentMethod, paymentStatus, extraFields = {} }) => {
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

    // Transactions require a replica set. Standalone local MongoDB throws
    // here — fall back to a sequential approach that still prevents
    // overselling via the conditional ($gte stock) update, just without
    // cross-collection atomicity.
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

  return { order: createdOrder, usedTransaction: useTransaction };
};

// @route POST /api/orders — protected. Cash on Delivery flow.
export const createOrder = asyncHandler(async (req, res) => {
  validateShippingAddress(req.body.shippingAddress);
  const { shippingAddress } = req.body;

  const { cart, orderItems, totalAmount } = await buildOrderItemsFromCart(req.user._id);

  const { order, usedTransaction } = await commitOrder({
    userId: req.user._id,
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

// @route GET /api/orders/my-orders — protected
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: { orders } });
});

// @route GET /api/orders/:id — protected. owner or admin only.
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

// @route GET /api/orders — admin only. paginated, filterable by status.
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
// Validates the transition and restores stock exactly once on cancellation.
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
    // Restore stock exactly once; the stockRestored flag guards against
    // a repeated cancellation request restoring inventory twice.
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

  res.status(200).json({ success: true, message: `Order marked as ${status}`, data: { order } });
});

// Exported for reuse by the payment controller (Razorpay verification
// needs the exact same cart-validation and order-commit logic).
export { buildOrderItemsFromCart, commitOrder };
