import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false, // kept even if the product is later deleted
    },
    name: { type: String, required: true }, // snapshot
    price: { type: Number, required: true, min: 0 }, // snapshot
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

export const ORDER_STATUSES = ['Placed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
export const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed'];

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['COD', 'Online'],
      default: 'COD',
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'Pending',
    },
    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'Placed',
    },
    stockRestored: { type: Boolean, default: false }, // guards against double stock restoration

    // Populated only for paymentMethod: 'Online' (Razorpay). Never trust
    // amounts from the client — these are identifiers only; the actual
    // amount paid is verified against Razorpay's own order record.
    razorpayOrderId: { type: String, default: undefined },
    razorpayPaymentId: { type: String, default: undefined },
    razorpaySignature: { type: String, default: undefined },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
