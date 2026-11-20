import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: 60,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    description: { type: String, trim: true, default: '', maxlength: 500 },
    isActive: { type: Boolean, default: true },
    // null/undefined = a top-level category. Set to another Category's
    // _id to make this a subcategory. Only one level of nesting is
    // enforced in the controller (a subcategory cannot itself have a
    // parent that is already a subcategory) to keep the catalogue simple
    // and the UI easy to navigate for a college project.
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
  },
  { timestamps: true }
);

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

categorySchema.pre('validate', function setSlug(next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = slugify(this.name);
  }
  next();
});

// A name must be unique among siblings (same parent), not globally —
// so "Accessories" can exist both as a top-level category and, say, as a
// subcategory under "Clothing" without colliding.
categorySchema.index({ name: 1, parentCategory: 1 }, { unique: true });
categorySchema.index({ slug: 1, parentCategory: 1 }, { unique: true });
categorySchema.index({ parentCategory: 1 });

const Category = mongoose.model('Category', categorySchema);
export default Category;
