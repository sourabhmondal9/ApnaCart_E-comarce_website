import ApiError from '../utils/ApiError.js';

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new ApiError(403, 'Access denied: administrator privileges required');
  }
  next();
};

export default adminOnly;
