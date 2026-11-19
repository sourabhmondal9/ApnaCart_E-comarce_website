import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Order from '../models/Order.js';
import { validateObjectId } from '../validators/productValidators.js';
import { streamInvoicePdf } from '../utils/generateInvoicePdf.js';

// @route GET /api/orders/:id/invoice — Owner or admin only.
// Generated PDF invoice.
export const downloadInvoice = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'order id');
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');

  const isOwner = order.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'You do not have access to this order');
  }

  streamInvoicePdf(order, res);
});
