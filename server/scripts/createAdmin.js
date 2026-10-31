/**
 * Safely creates (or promotes) an administrator account.
 * This is a one-off LOCAL script — never expose admin creation over a
 * public API route.
 *
 * Usage (from the server/ folder):
 *   ADMIN_NAME="Site Admin" ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="ChangeMe123!" npm run create-admin
 *
 * Or just run `npm run create-admin` and it will prompt interactively.
 */
import dotenv from 'dotenv';
dotenv.config();
import readline from 'readline';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const ask = (question, hidden = false) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

const run = async () => {
  await connectDB();

  let name = process.env.ADMIN_NAME;
  let email = process.env.ADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD;

  if (!name) name = await ask('Admin name: ');
  if (!email) email = await ask('Admin email: ');
  if (!password) password = await ask('Admin password (min 6 chars): ');

  if (!name || !email || !password || password.length < 6) {
    console.error('Name, a valid email, and a password of at least 6 characters are required.');
    process.exit(1);
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });

  if (existing) {
    existing.role = 'admin';
    existing.name = name;
    existing.password = password; // pre-save hook re-hashes it
    existing.isActive = true;
    await existing.save();
    console.log(`Existing user "${email}" promoted to admin and password updated.`);
  } else {
    await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: 'admin',
    });
    console.log(`Admin account created for "${email}".`);
  }

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to create admin:', err.message);
  process.exit(1);
});
