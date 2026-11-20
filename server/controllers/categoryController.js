import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { validateObjectId } from '../validators/productValidators.js';

/**
 * Arranges a flat category list into a tree: top-level categories with a
 * `subcategories` array attached. Only one level of nesting is supported
 * (a subcategory's own `subcategories` array is always empty) — enough
 * for a typical storefront catalogue without turning the admin UI into a
 * full recursive tree editor.
 */
const buildCategoryTree = (categories) => {
  const byId = new Map(categories.map((c) => [c._id.toString(), { ...c.toObject(), subcategories: [] }]));
  const roots = [];

  for (const cat of byId.values()) {
    if (cat.parentCategory) {
      const parent = byId.get(cat.parentCategory.toString());
      if (parent) {
        parent.subcategories.push(cat);
        continue;
      }
    }
    roots.push(cat);
  }
  return roots;
};

// @route GET /api/categories — public, returns active categories as a tree
// Admins can pass ?includeInactive=true to manage everything.
// Pass ?flat=true to get the plain list instead of a nested tree (used by
// admin forms that need every category in a single <select>).
export const getCategories = asyncHandler(async (req, res) => {
  const wantsInactive = req.query.includeInactive === 'true' && req.user && req.user.role === 'admin';
  const query = wantsInactive ? {} : { isActive: true };
  const categories = await Category.find(query).sort({ name: 1 });

  if (req.query.flat === 'true') {
    return res.status(200).json({ success: true, data: { categories } });
  }

  res.status(200).json({ success: true, data: { categories: buildCategoryTree(categories) } });
});

// @route POST /api/categories — admin only
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parentCategory } = req.body;
  if (!name || !name.trim()) throw new ApiError(400, 'Category name is required');

  let parentDoc = null;
  if (parentCategory) {
    validateObjectId(parentCategory, 'parent category id');
    parentDoc = await Category.findById(parentCategory);
    if (!parentDoc) throw new ApiError(400, 'Parent category does not exist');
    if (parentDoc.parentCategory) {
      throw new ApiError(400, 'Cannot create a subcategory under another subcategory (only one level of nesting is supported)');
    }
  }

  const existing = await Category.findOne({ name: name.trim(), parentCategory: parentDoc ? parentDoc._id : null });
  if (existing) throw new ApiError(409, 'A category with this name already exists at this level');

  const category = await Category.create({
    name: name.trim(),
    description: description || '',
    parentCategory: parentDoc ? parentDoc._id : null,
  });
  res.status(201).json({ success: true, message: 'Category created', data: { category } });
});

// @route PUT /api/categories/:id — admin only
export const updateCategory = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'category id');

  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');

  const allowed = ['name', 'description', 'isActive'];
  const updates = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  // Changing parentCategory is handled separately with extra validation,
  // since it changes the shape of the tree.
  if (req.body.parentCategory !== undefined) {
    const newParentId = req.body.parentCategory;

    if (newParentId === null || newParentId === '') {
      updates.parentCategory = null;
    } else {
      validateObjectId(newParentId, 'parent category id');
      if (newParentId === req.params.id) {
        throw new ApiError(400, 'A category cannot be its own parent');
      }
      const parentDoc = await Category.findById(newParentId);
      if (!parentDoc) throw new ApiError(400, 'Parent category does not exist');
      if (parentDoc.parentCategory) {
        throw new ApiError(400, 'Cannot nest a subcategory under another subcategory');
      }
      const hasChildren = await Category.exists({ parentCategory: category._id });
      if (hasChildren) {
        throw new ApiError(400, 'This category has its own subcategories and cannot become a subcategory itself');
      }
      updates.parentCategory = parentDoc._id;
    }
  }

  Object.assign(category, updates);
  await category.save();

  res.status(200).json({ success: true, message: 'Category updated', data: { category } });
});

// @route DELETE /api/categories/:id — admin only
// If products reference this category, or it has subcategories, deactivate
// instead of deleting so nothing is left dangling.
export const deleteCategory = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'category id');
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');

  const [hasProducts, hasSubcategories] = await Promise.all([
    Product.exists({ category: category._id }),
    Category.exists({ parentCategory: category._id }),
  ]);

  if (hasProducts || hasSubcategories) {
    category.isActive = false;
    await category.save();
    return res.status(200).json({
      success: true,
      message: hasSubcategories
        ? 'Category has subcategories, so it was deactivated instead of deleted'
        : 'Category has existing products, so it was deactivated instead of deleted',
      data: { category },
    });
  }

  await category.deleteOne();
  res.status(200).json({ success: true, message: 'Category deleted' });
});
