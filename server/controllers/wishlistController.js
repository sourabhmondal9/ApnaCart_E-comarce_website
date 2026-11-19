import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { validateObjectId } from '../validators/productValidators.js';

const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, products: [] });
  return wishlist;
};

// @route GET /api/wishlist — protected
export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  await wishlist.populate({
    path: 'products',
    select: 'name price imageUrl stock isActive category',
    populate: { path: 'category', select: 'name' },
  });

  const products = wishlist.products.filter(Boolean);

  res.status(200).json({ success: true, data: { products } });
});

// @route POST /api/wishlist/items
export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  validateObjectId(productId, 'product id');

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const wishlist = await getOrCreateWishlist(req.user._id);
  const alreadySaved = wishlist.products.some((p) => p.toString() === productId);
  if (!alreadySaved) {
    wishlist.products.push(productId);
    await wishlist.save();
  }

  res.status(200).json({ success: true, message: 'Added to wishlist', data: { productIds: wishlist.products } });
});

// @route DELETE /api/wishlist/items/:productId
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  validateObjectId(productId, 'product id');

  const wishlist = await getOrCreateWishlist(req.user._id);
  wishlist.products = wishlist.products.filter((p) => p.toString() !== productId);
  await wishlist.save();

  res.status(200).json({ success: true, message: 'Removed from wishlist', data: { productIds: wishlist.products } });
});

// @route GET /api/wishlist/ids — protected
export const getWishlistIds = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  res.status(200).json({ success: true, data: { productIds: wishlist.products } });
});
