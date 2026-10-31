import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';

/**
 * Verifies the Bearer JWT, confirms the user still exists and is active,
 * and attaches the fresh user document (minus password) to req.user.
 * Never trusts an id/role embedded in the request body.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Not authorized, invalid or expired token');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'Not authorized, user no longer exists');
  }
  if (!user.isActive) {
    throw new ApiError(401, 'Not authorized, account is deactivated');
  }

  req.user = user; // full mongoose doc; password is select:false so it's absent
  next();
});

export default protect;
