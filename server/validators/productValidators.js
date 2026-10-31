import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';

export const validateProductInput = (body, { partial = false } = {}) => {
  const errors = [];
  const { name, description, price, stock, category } = body;

  if (!partial || name !== undefined) {
    if (!name || typeof name !== 'string' || !name.trim()) errors.push('Product name is required');
  }
  if (!partial || description !== undefined) {
    if (!description || typeof description !== 'string' || !description.trim()) {
      errors.push('Product description is required');
    }
  }
  if (!partial || price !== undefined) {
    const p = Number(price);
    if (price === undefined || price === null || Number.isNaN(p) || !Number.isFinite(p) || p < 0) {
      errors.push('Price must be a finite number greater than or equal to 0');
    }
  }
  if (!partial || stock !== undefined) {
    const s = Number(stock);
    if (stock === undefined || stock === null || !Number.isInteger(s) || s < 0) {
      errors.push('Stock must be a whole number greater than or equal to 0');
    }
  }
  if (!partial || category !== undefined) {
    if (!category || !mongoose.isValidObjectId(category)) {
      errors.push('A valid category is required');
    }
  }

  if (errors.length) throw new ApiError(400, 'Invalid product data', errors);
};

export const validateObjectId = (id, label = 'id') => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
};
