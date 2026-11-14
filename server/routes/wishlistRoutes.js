import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getWishlistIds,
} from '../controllers/wishlistController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // wishlist always requires a logged-in customer

router.get('/', getWishlist);
router.get('/ids', getWishlistIds);
router.post('/items', addToWishlist);
router.delete('/items/:productId', removeFromWishlist);

export default router;
