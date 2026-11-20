import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { verifyEmailConfig } from './utils/sendEmail.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

import notFound from './middleware/notFoundMiddleware.js';
import errorMiddleware from './middleware/errorMiddleware.js';

const app = express();

// Render (like Heroku, Railway, etc.) puts the app behind exactly one
// reverse proxy, which sets X-Forwarded-For to the real client IP. By
// default Express doesn't trust that header (to prevent IP spoofing from
// a malicious client setting it directly), which makes express-rate-limit
// refuse to use it for identifying who's making a request. Trusting
// exactly one hop tells Express "the first IP in X-Forwarded-For is real,
// set by our own infrastructure" without blindly trusting the whole
// header the way `app.set('trust proxy', true)` would.
// Locally (no proxy in front), this setting is simply unused.
app.set('trust proxy', 1);

// --- Core middleware ---
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);

// --- 404 + centralized error handling (must be last) ---
app.use('/api', notFound);
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  // Fire-and-forget: a slow/unreachable SMTP server should never delay
  // the app from starting, but the result is still logged clearly.
  verifyEmailConfig().catch((err) => console.error('verifyEmailConfig() crashed unexpectedly:', err.message));
};

start();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err.message);
});
