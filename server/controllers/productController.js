import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Category from '../models/Category.js';
import { validateProductInput, validateObjectId } from '../validators/productValidators.js';

// @route GET /api/products
// Public. Supports search, category filter, sort, pagination.
// Only returns isActive products for non-admin requests.
export const getProducts = asyncHandler(async (req, res) => {
  const { search, category, sort, page = 1, limit = 12, includeInactive } = req.query;

  const query = {};

  // Only an authenticated admin viewing the admin list may see inactive products
  const wantsInactive = includeInactive === 'true' && req.user && req.user.role === 'admin';
  if (!wantsInactive) query.isActive = true;

  if (search && typeof search === 'string' && search.trim()) {
    query.$text = { $search: search.trim() };
  }

  if (category && typeof category === 'string') {
    validateObjectId(category, 'category id');
    // If the selected category has subcategories, include products filed
    // directly under those subcategories too — selecting a parent like
    // "Clothing" should also surface products under "Clothing > Men".
    const subcategoryIds = await Category.find({ parentCategory: category }).distinct('_id');
    query.category = subcategoryIds.length > 0 ? { $in: [category, ...subcategoryIds] } : category;
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'price_asc') sortOption = { price: 1 };
  else if (sort === 'price_desc') sortOption = { price: -1 };
  else if (sort === 'newest') sortOption = { createdAt: -1 };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(query).populate({ path: 'category', select: 'name slug parentCategory', populate: { path: 'parentCategory', select: 'name slug' } }).sort(sortOption).skip(skip).limit(limitNum),
    Product.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    },
  });
});

// @route GET /api/products/:id
export const getProductById = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'product id');
  const product = await Product.findById(req.params.id).populate({ path: 'category', select: 'name slug parentCategory', populate: { path: 'parentCategory', select: 'name slug' } });

  if (!product || (!product.isActive && (!req.user || req.user.role !== 'admin'))) {
    throw new ApiError(404, 'Product not found');
  }

  res.status(200).json({ success: true, data: { product } });
});

// @route POST /api/products — admin only
export const createProduct = asyncHandler(async (req, res) => {
  validateProductInput(req.body);
  const { name, description, price, stock, imageUrl, category } = req.body;

  const categoryDoc = await Category.findById(category);
  if (!categoryDoc) throw new ApiError(400, 'Referenced category does not exist');

  const product = await Product.create({
    name: name.trim(),
    description: description.trim(),
    price: Number(price),
    stock: Number(stock),
    imageUrl: imageUrl || '',
    category,
  });

  res.status(201).json({ success: true, message: 'Product created', data: { product } });
});

// @route PUT /api/products/:id — admin only
export const updateProduct = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'product id');
  validateProductInput(req.body, { partial: true });

  if (req.body.category) {
    const categoryDoc = await Category.findById(req.body.category);
    if (!categoryDoc) throw new ApiError(400, 'Referenced category does not exist');
  }

  // allowlist fields — ignore anything else the client sends
  const allowed = ['name', 'description', 'price', 'stock', 'imageUrl', 'category', 'isActive'];
  const updates = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate({ path: 'category', select: 'name slug parentCategory', populate: { path: 'parentCategory', select: 'name slug' } });

  if (!product) throw new ApiError(404, 'Product not found');

  res.status(200).json({ success: true, message: 'Product updated', data: { product } });
});

// @route DELETE /api/products/:id — admin only
// Prefers safe deactivation over hard delete when the product is
// referenced by any existing order, so order history stays intact.
export const deleteProduct = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'product id');
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  const referencedInOrders = await Order.exists({ 'items.product': product._id });

  if (referencedInOrders) {
    product.isActive = false;
    await product.save();
    return res.status(200).json({
      success: true,
      message: 'Product has existing orders, so it was deactivated instead of deleted',
      data: { product },
    });
  }

  await product.deleteOne();
  res.status(200).json({ success: true, message: 'Product deleted' });
});
