import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { validateObjectId } from '../validators/productValidators.js';

// @route GET /api/categories — public, returns active categories
// Admins can pass ?includeInactive=true to manage everything.
export const getCategories = asyncHandler(async (req, res) => {
  const wantsInactive = req.query.includeInactive === 'true' && req.user && req.user.role === 'admin';
  const query = wantsInactive ? {} : { isActive: true };
  const categories = await Category.find(query).sort({ name: 1 });
  res.status(200).json({ success: true, data: { categories } });
});

// @route POST /api/categories — admin only
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) throw new ApiError(400, 'Category name is required');

  const existing = await Category.findOne({ name: name.trim() });
  if (existing) throw new ApiError(409, 'A category with this name already exists');

  const category = await Category.create({ name: name.trim(), description: description || '' });
  res.status(201).json({ success: true, message: 'Category created', data: { category } });
});

// @route PUT /api/categories/:id — admin only
export const updateCategory = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'category id');
  const allowed = ['name', 'description', 'isActive'];
  const updates = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const category = await Category.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!category) throw new ApiError(404, 'Category not found');

  res.status(200).json({ success: true, message: 'Category updated', data: { category } });
});

// @route DELETE /api/categories/:id — admin only
// If products reference this category, deactivate instead of deleting so
// existing products don't end up with a dangling category reference.
export const deleteCategory = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'category id');
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');

  const hasProducts = await Product.exists({ category: category._id });
  if (hasProducts) {
    category.isActive = false;
    await category.save();
    return res.status(200).json({
      success: true,
      message: 'Category has existing products, so it was deactivated instead of deleted',
      data: { category },
    });
  }

  await category.deleteOne();
  res.status(200).json({ success: true, message: 'Category deleted' });
});
