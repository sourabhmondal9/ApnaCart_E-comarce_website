import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { downloadInvoice } from '../controllers/invoiceController.js';
import protect from '../middleware/authMiddleware.js';
import adminOnly from '../middleware/adminMiddleware.js';

const router = express.Router();

router.use(protect); // every order route requires authentication

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/', adminOnly, getAllOrders);
router.get('/:id', getOrderById); // ownership checked inside controller
router.get('/:id/invoice', downloadInvoice); // ownership checked inside controller
router.patch('/:id/status', adminOnly, updateOrderStatus);

export default router;
