import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';
import { validateRegisterInput, validateLoginInput } from '../validators/authValidators.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// @route POST /api/auth/register
// Public. Only accepts name/email/password/phone — role is never taken
// from the request body, so nobody can self-register as admin.
export const register = asyncHandler(async (req, res) => {
  validateRegisterInput(req.body);
  const { name, email, password, phone } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    phone: phone || undefined,
    role: 'customer', // hardcoded; ignore any role sent by the client
  });

  const token = signToken(user._id);
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user: user.toSafeObject(), token },
  });
});

// @route POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  validateLoginInput(req.body);
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) {
    throw new ApiError(401, 'This account has been deactivated');
  }

  const match = await user.comparePassword(password);
  if (!match) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken(user._id);
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { user: user.toSafeObject(), token },
  });
});

// @route GET /api/auth/me
// Protected.
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user.toSafeObject() } });
});

// @route PATCH /api/auth/me
// Protected. Allowlisted fields only — role/email/password changes are
// out of scope here on purpose to keep auth state changes explicit.
export const updateMe = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'address'];
  const updates = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, message: 'Profile updated', data: { user: user.toSafeObject() } });
});
