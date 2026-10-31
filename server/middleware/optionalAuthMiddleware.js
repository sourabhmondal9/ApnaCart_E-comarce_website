import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Attaches req.user if a valid Bearer token is present, but never blocks
 * the request if it's missing or invalid. Used on public read routes
 * (product/category listings) that behave slightly differently for a
 * logged-in admin (e.g. showing inactive items) but must stay open to
 * anonymous visitors.
 */
const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) req.user = user;
    } catch {
      // invalid/expired token on a public route — ignore and continue as anonymous
    }
  }
  next();
};

export default optionalAuth;
