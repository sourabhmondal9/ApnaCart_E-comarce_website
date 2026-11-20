import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    pincode: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // never returned by default queries
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9+\-\s]{7,15}$/, 'Please provide a valid phone number'],
      default: undefined,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    address: { type: addressSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },

    // Password reset flow: only a SHA-256 hash of the reset token is ever
    // stored (never the raw token, which is emailed to the user once and
    // never persisted anywhere) — mirrors how passwords themselves are
    // never stored in plain text. select: false keeps these out of normal
    // queries/API responses by default, same as password.
    passwordResetToken: { type: String, select: false, default: undefined },
    passwordResetExpires: { type: Date, select: false, default: undefined },
  },
  { timestamps: true }
);

// Hash password only when it is new or modified
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Belt-and-suspenders: strip password/__v even if select('+password') was used upstream
userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
