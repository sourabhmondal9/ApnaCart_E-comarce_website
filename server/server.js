import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

import notFound from './middleware/notFoundMiddleware.js';
import errorMiddleware from './middleware/errorMiddleware.js';

const app = express();

// --- Core middleware ---
app.use(
  cors({
    origin: "https://shopcom-frontend.onrender.com"|| "https://shopcom-frontend.onrender.com",
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

// --- 404 + centralized error handling (must be last) ---
app.use('/api', notFound);
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

start();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err.message);
});
