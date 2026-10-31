import ApiError from '../utils/ApiError.js';

/**
 * Must run after `protect`. Confirms the authenticated user's role in the
 * database is 'admin' — the frontend's belief about the user's role is
 * never trusted.
 */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new ApiError(403, 'Access denied: administrator privileges required');
  }
  next();
};

export default adminOnly;
