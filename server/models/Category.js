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

categorySchema.index({ name: 1, parentCategory: 1 }, { unique: true });
categorySchema.index({ slug: 1, parentCategory: 1 }, { unique: true });
categorySchema.index({ parentCategory: 1 });

const Category = mongoose.model('Category', categorySchema);
export default Category;
