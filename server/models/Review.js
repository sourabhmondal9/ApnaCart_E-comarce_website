import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number between 1 and 5',
      },
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: 5,
      maxlength: 1000,
    },
    // True if, at the time of writing, this user had a Delivered order
    // containing this product. Computed once when the review is
    // created/updated (see reviewController.js) — a simple, honest
    // "Verified Purchase" signal without re-querying orders on every read.
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per user per product — resubmitting edits the existing one
// instead of creating duplicates (enforced again in the controller via
// upsert, this index is the DB-level guarantee).
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
