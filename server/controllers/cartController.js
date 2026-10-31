import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { validateObjectId } from '../validators/productValidators.js';

/**
 * Builds a response payload for a cart: populates product data and
 * recalculates every line total and the grand total from the CURRENT
 * database price/stock — the frontend's numbers are never trusted.
 * Items referencing deleted/inactive products are flagged, not silently
 * dropped, so the user can see and remove them.
 */
const buildCartResponse = async (cart) => {
  if (!cart || cart.items.length === 0) {
    return { items: [], subtotal: 0, totalItems: 0 };
  }

  const productIds = cart.items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds } }).populate('category', 'name');
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  let subtotal = 0;
  let totalItems = 0;

  const items = cart.items.map((item) => {
    const product = productMap.get(item.product.toString());
    const unavailable = !product || !product.isActive;
    const exceedsStock = product ? item.quantity > product.stock : false;
    const lineTotal = product && !unavailable ? product.price * item.quantity : 0;

    if (!unavailable) {
      subtotal += lineTotal;
      totalItems += item.quantity;
    }

    return {
      product: product
        ? {
            _id: product._id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            stock: product.stock,
            category: product.category,
          }
        : { _id: item.product, name: 'Product no longer available' },
      quantity: item.quantity,
      lineTotal,
      unavailable,
      exceedsStock,
    };
  });

  return { items, subtotal, totalItems };
};

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

// @route GET /api/cart — protected
export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const data = await buildCartResponse(cart);
  res.status(200).json({ success: true, data });
});

// @route POST /api/cart/items — protected. body: { productId, quantity }
export const addItemToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  validateObjectId(productId, 'product id');

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) {
    throw new ApiError(400, 'Quantity must be a positive whole number');
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, 'Product not found or unavailable');

  const cart = await getOrCreateCart(req.user._id);
  const existingItem = cart.items.find((i) => i.product.toString() === productId);
  const newQty = existingItem ? existingItem.quantity + qty : qty;

  if (newQty > product.stock) {
    throw new ApiError(400, `Only ${product.stock} unit(s) of "${product.name}" available in stock`);
  }

  if (existingItem) {
    existingItem.quantity = newQty;
  } else {
    cart.items.push({ product: productId, quantity: qty });
  }

  await cart.save();
  const data = await buildCartResponse(cart);
  res.status(200).json({ success: true, message: 'Item added to cart', data });
});

// @route PATCH /api/cart/items/:productId — protected. body: { quantity }
export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  validateObjectId(productId, 'product id');

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) {
    throw new ApiError(400, 'Quantity must be a positive whole number');
  }

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');
  if (qty > product.stock) {
    throw new ApiError(400, `Only ${product.stock} unit(s) of "${product.name}" available in stock`);
  }

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) throw new ApiError(404, 'Item not found in cart');

  item.quantity = qty;
  await cart.save();
  const data = await buildCartResponse(cart);
  res.status(200).json({ success: true, message: 'Cart updated', data });
});

// @route DELETE /api/cart/items/:productId — protected
export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  validateObjectId(productId, 'product id');

  const cart = await getOrCreateCart(req.user._id);
  const before = cart.items.length;
  cart.items = cart.items.filter((i) => i.product.toString() !== productId);

  if (cart.items.length === before) {
    throw new ApiError(404, 'Item not found in cart');
  }

  await cart.save();
  const data = await buildCartResponse(cart);
  res.status(200).json({ success: true, message: 'Item removed from cart', data });
});

// @route DELETE /api/cart — protected. clears the whole cart.
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.status(200).json({ success: true, message: 'Cart cleared', data: { items: [], subtotal: 0, totalItems: 0 } });
});
