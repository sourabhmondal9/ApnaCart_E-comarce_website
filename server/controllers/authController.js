import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';
import { validateRegisterInput, validateLoginInput } from '../validators/authValidators.js';
import { sendEmail } from '../utils/sendEmail.js';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// @route POST /api/auth/register
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
    role: 'customer',
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


export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user.toSafeObject() } });
});

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


export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    throw new ApiError(400, 'A valid email is required');
  }

  const genericMessage = 'If an account with that email exists, a password reset link has been sent.';
  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (user && user.isActive) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;
    sendEmail({
      to: user.email,
      subject: 'Reset your ApnaCart password',
      text: `Hi ${user.name},\n\nYou requested a password reset. This link expires in 30 minutes:\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email — your password will not be changed.\n\n— ApnaCart (Apni Pasand. Apni Shopping.)`,
    }).catch((err) => console.error('Password reset email failed:', err.message));
  }

  res.status(200).json({ success: true, message: genericMessage });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new ApiError(400, 'This password reset link is invalid or has expired. Please request a new one.');
  }

  user.password = password; // pre-save hook re-hashes it
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();


  const jwtToken = signToken(user._id);
  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully',
    data: { user: user.toSafeObject(), token: jwtToken },
  });
});
