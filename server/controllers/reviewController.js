import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { validateReviewInput } from '../validators/reviewValidators.js';
import { validateObjectId } from '../validators/productValidators.js';

/**
 * Recalculates a product's denormalized ratingsAverage/ratingsCount from
 * its current Review documents. Called after every create/update/delete
 * so the summary shown on product cards and details never drifts from
 * the underlying reviews.
 */
const recalculateProductRating = async (productId) => {
  const [summary] = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Product.findByIdAndUpdate(productId, {
    ratingsAverage: summary ? Math.round(summary.avg * 10) / 10 : 0,
    ratingsCount: summary ? summary.count : 0,
  });
};

/**
 * A review counts as a "Verified Purchase" if this user has a Delivered
 * order that contains this product. Checked fresh each time a review is
 * written rather than trusted from the client.
 */
const checkVerifiedPurchase = async (userId, productId) => {
  const delivered = await Order.exists({
    user: userId,
    orderStatus: 'Delivered',
    'items.product': productId,
  });
  return Boolean(delivered);
};

// @route GET /api/products/:id/reviews — public. Paginated, newest first.
export const getProductReviews = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'product id');
  const { page = 1, limit = 10 } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [reviews, total] = await Promise.all([
    Review.find({ product: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Review.countDocuments({ product: req.params.id }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      reviews,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 },
    },
  });
});

// @route POST /api/products/:id/reviews — protected
// Upsert: a customer can only have one review per product. Submitting
// again edits their existing review rather than creating a duplicate
// (also enforced at the DB level by Review's unique compound index).
export const upsertReview = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'product id');
  validateReviewInput(req.body);
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product || !product.isActive) throw new ApiError(404, 'Product not found');

  const isVerifiedPurchase = await checkVerifiedPurchase(req.user._id, req.params.id);

  // Explicit $set/$setOnInsert, rather than a bare update object, so this
  // is unambiguously a partial update — never a full-document replacement
  // that could wipe the product/user reference on an existing review.
  const review = await Review.findOneAndUpdate(
    { product: req.params.id, user: req.user._id },
    {
      $set: { rating: Number(rating), comment: comment.trim(), isVerifiedPurchase },
      $setOnInsert: { product: req.params.id, user: req.user._id },
    },
    { new: true, upsert: true, runValidators: true }
  ).populate('user', 'name');

  await recalculateProductRating(req.params.id);

  res.status(201).json({ success: true, message: 'Review submitted', data: { review } });
});

// @route DELETE /api/products/:id/reviews/:reviewId — protected
// A customer may delete only their own review; an admin may delete any.
export const deleteReview = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'product id');
  validateObjectId(req.params.reviewId, 'review id');

  const review = await Review.findById(req.params.reviewId);
  if (!review || review.product.toString() !== req.params.id) {
    throw new ApiError(404, 'Review not found');
  }

  const isOwner = review.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    throw new ApiError(403, 'You can only delete your own review');
  }

  await review.deleteOne();
  await recalculateProductRating(req.params.id);

  res.status(200).json({ success: true, message: 'Review deleted' });
});

// @route GET /api/products/:id/reviews/mine — protected
// Lets the frontend know whether the current user already reviewed this
// product (and with what), so it can pre-fill the review form as "edit"
// rather than "write a new review".
export const getMyReviewForProduct = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'product id');
  const review = await Review.findOne({ product: req.params.id, user: req.user._id });
  res.status(200).json({ success: true, data: { review: review || null } });
});
