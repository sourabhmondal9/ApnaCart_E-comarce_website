import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import {
  getProductReviews,
  upsertReview,
  deleteReview,
  getMyReviewForProduct,
} from '../controllers/reviewController.js';
import protect from '../middleware/authMiddleware.js';
import adminOnly from '../middleware/adminMiddleware.js';
import optionalAuth from '../middleware/optionalAuthMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, getProducts);
router.get('/:id', optionalAuth, getProductById);
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

// Reviews are nested under their product, since they only ever make
// sense in that context (GET is public — anyone can read reviews).
router.get('/:id/reviews', getProductReviews);
router.get('/:id/reviews/mine', protect, getMyReviewForProduct);
router.post('/:id/reviews', protect, upsertReview);
router.delete('/:id/reviews/:reviewId', protect, deleteReview);

export default router;
