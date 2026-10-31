/**
 * Idempotent seed script: creates sample categories and ~20 products.
 * Safe to run multiple times — uses upsert-style logic so re-running it
 * will not create duplicate categories or products.
 *
 * Usage (from server/ folder): npm run seed
 */
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

const categoriesData = [
  { name: 'Electronics', description: 'Gadgets, devices and accessories' },
  { name: 'Clothing', description: 'Apparel for everyday wear' },
  { name: 'Books', description: 'Fiction, non-fiction and academic books' },
  { name: 'Home and Kitchen', description: 'Appliances and home essentials' },
  { name: 'Accessories', description: 'Bags, watches and everyday carry' },
];

// imageUrl values use Unsplash's stable "source" style placeholders keyed
// by category so the catalogue never shows a broken image link.
const productsByCategory = {
  Electronics: [
    { name: 'Wireless Bluetooth Headphones', price: 2499, stock: 40, description: 'Over-ear wireless headphones with 30-hour battery life and noise isolation.' },
    { name: '65W USB-C Fast Charger', price: 999, stock: 80, description: 'Compact GaN charger compatible with laptops and smartphones.' },
    { name: '27-inch Full HD Monitor', price: 10999, stock: 15, description: 'IPS panel monitor with slim bezels, ideal for work and study.' },
    { name: 'Mechanical Keyboard', price: 3299, stock: 25, description: 'Tactile mechanical keyboard with backlit keys and USB-C connector.' },
    { name: 'Wireless Mouse', price: 799, stock: 60, description: 'Ergonomic wireless mouse with silent clicks and long battery life.' },
    { name: 'Portable Power Bank 20000mAh', price: 1799, stock: 50, description: 'High-capacity power bank with dual USB output and fast charging.' },
  ],
  Clothing: [
    { name: "Men's Cotton Casual Shirt", price: 899, stock: 35, description: 'Breathable 100% cotton shirt, regular fit, available in classic colours.' },
    { name: "Women's Denim Jacket", price: 1699, stock: 20, description: 'Classic blue denim jacket with front pockets and button closure.' },
    { name: 'Unisex Graphic T-Shirt', price: 499, stock: 70, description: 'Soft cotton t-shirt with minimalist graphic print.' },
    { name: 'Formal Trousers', price: 1299, stock: 30, description: 'Slim-fit formal trousers suitable for office wear.' },
    { name: 'Running Shorts', price: 599, stock: 45, description: 'Lightweight, moisture-wicking shorts for workouts and running.' },
  ],
  Books: [
    { name: 'Data Structures and Algorithms', price: 549, stock: 25, description: 'A comprehensive textbook covering core DSA concepts with examples.' },
    { name: 'Introduction to Database Systems', price: 699, stock: 18, description: 'Fundamentals of relational and non-relational database design.' },
    { name: 'The Pragmatic Programmer', price: 799, stock: 20, description: 'Classic guide to software craftsmanship and best practices.' },
    { name: 'Modern Web Development', price: 649, stock: 22, description: 'Practical guide to building full-stack web applications.' },
  ],
  'Home and Kitchen': [
    { name: 'Stainless Steel Cookware Set', price: 2999, stock: 12, description: '5-piece stainless steel cookware set suitable for all stovetops.' },
    { name: 'Electric Kettle 1.5L', price: 899, stock: 40, description: 'Fast-boiling electric kettle with auto shut-off.' },
    { name: 'Non-stick Frying Pan', price: 699, stock: 35, description: '28cm non-stick frying pan with heat-resistant handle.' },
    { name: 'LED Desk Lamp', price: 749, stock: 28, description: 'Adjustable LED desk lamp with multiple brightness levels.' },
  ],
  Accessories: [
    { name: 'Leather Wallet', price: 799, stock: 50, description: 'Genuine leather bi-fold wallet with multiple card slots.' },
    { name: 'Analog Wrist Watch', price: 1999, stock: 25, description: 'Classic analog watch with stainless steel strap.' },
    { name: 'Laptop Backpack', price: 1599, stock: 30, description: 'Water-resistant backpack with padded laptop compartment.' },
    { name: 'Sunglasses UV400', price: 649, stock: 40, description: 'Polarized sunglasses with UV400 protection.' },
  ],
};

const imageFor = (categoryName, productName) => {
  const query = encodeURIComponent(`${categoryName} ${productName}`.split(' ').slice(0, 3).join(','));
  return `https://source.unsplash.com/400x400/?${query}`;
};

const run = async () => {
  await connectDB();

  const categoryDocs = {};
  for (const cat of categoriesData) {
    const existing = await Category.findOneAndUpdate(
      { name: cat.name },
      { $setOnInsert: { name: cat.name, description: cat.description, isActive: true } },
      { upsert: true, new: true }
    );
    categoryDocs[cat.name] = existing;
  }
  console.log(`Categories ready: ${Object.keys(categoryDocs).length}`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const [categoryName, products] of Object.entries(productsByCategory)) {
    const categoryDoc = categoryDocs[categoryName];
    for (const p of products) {
      const exists = await Product.findOne({ name: p.name, category: categoryDoc._id });
      if (exists) {
        skippedCount += 1;
        continue;
      }
      await Product.create({
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        imageUrl: imageFor(categoryName, p.name),
        category: categoryDoc._id,
        isActive: true,
      });
      createdCount += 1;
    }
  }

  console.log(`Products created: ${createdCount}, already existed (skipped): ${skippedCount}`);
  console.log('Seeding complete.');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
