import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';

// @route GET /api/admin/stats — admin only
// Summary statistics for the admin dashboard, computed from live DB data.
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalProducts, activeProducts, totalCategories, totalCustomers, totalOrders, revenueAgg, statusCounts] =
    await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ isActive: true }),
      Category.countDocuments({}),
      User.countDocuments({ role: 'customer' }),
      Order.countDocuments({}),
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    ]);

  const totalRevenue = revenueAgg[0]?.total || 0;
  const ordersByStatus = statusCounts.reduce((acc, s) => {
    acc[s._id] = s.count;
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: {
      totalProducts,
      activeProducts,
      totalCategories,
      totalCustomers,
      totalOrders,
      totalRevenue,
      ordersByStatus,
    },
  });
});
