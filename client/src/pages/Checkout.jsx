import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { placeOrder } from '../services/orderService.js';
import { createRazorpayOrder, verifyRazorpayPayment, loadRazorpayScript } from '../services/paymentService.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { isValidPincode } from '../utils/validators.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const Checkout = () => {
  const { cart, loading, emptyCart } = useCart();
  const { user } = useAuth();
  const [address, setAddress] = useState({ street: '', city: '', state: '', pincode: '' });
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' | 'Online'
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setAddress({ ...address, [e.target.name]: e.target.value });

  const validate = () => {
    const errs = {};
    if (!address.street.trim()) errs.street = 'Street address is required';
    if (!address.city.trim()) errs.city = 'City is required';
    if (!address.state.trim()) errs.state = 'State is required';
    if (!isValidPincode(address.pincode)) errs.pincode = 'Enter a valid pincode';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const placeCodOrder = async () => {
    const order = await placeOrder({ shippingAddress: address, paymentMethod: 'COD' });
    await emptyCart();
    navigate(`/my-orders/${order._id}`, { replace: true, state: { justPlaced: true } });
  };

  /**
   * Opens Razorpay's Checkout widget. On success, sends the returned
   * payment identifiers + signature to the backend for verification —
   * the backend recomputes the HMAC signature itself and never trusts
   * the "success" callback alone. Our own Order is only created after
   * that server-side verification passes (see paymentController.js).
   */
  const payOnline = async () => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Could not load the payment widget. Check your internet connection and try again.');
    }

    const { razorpayOrderId, amount, currency, keyId } = await createRazorpayOrder();

    await new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: 'ShopMCA',
        description: 'Order payment',
        order_id: razorpayOrderId,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#2563eb' },
        handler: async (response) => {
          try {
            const order = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              shippingAddress: address,
            });
            await emptyCart();
            navigate(`/my-orders/${order._id}`, { replace: true, state: { justPlaced: true } });
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        modal: {
          // user closed the widget without completing payment
          ondismiss: () => reject(new Error('Payment was cancelled.')),
        },
      });

      rzp.on('payment.failed', (response) => {
        reject(new Error(response.error?.description || 'Payment failed. Please try again.'));
      });

      rzp.open();
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    if (submitting) return; // guard against double submission

    setSubmitting(true);
    try {
      if (paymentMethod === 'COD') {
        await placeCodOrder();
      } else {
        await payOnline();
      }
    } catch (err) {
      setSubmitError(err.details ? err.details.join(', ') : err.message);
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!cart.items || cart.items.length === 0) {
    return <p className="empty-state">Your cart is empty — add items before checking out.</p>;
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={handleSubmit} noValidate>
          <h2>Shipping Address</h2>
          {submitError && <p className="form-error">{submitError}</p>}

          <label htmlFor="street">Street Address</label>
          <input id="street" name="street" value={address.street} onChange={handleChange} />
          {errors.street && <p className="field-error">{errors.street}</p>}

          <label htmlFor="city">City</label>
          <input id="city" name="city" value={address.city} onChange={handleChange} />
          {errors.city && <p className="field-error">{errors.city}</p>}

          <label htmlFor="state">State</label>
          <input id="state" name="state" value={address.state} onChange={handleChange} />
          {errors.state && <p className="field-error">{errors.state}</p>}

          <label htmlFor="pincode">Pincode</label>
          <input id="pincode" name="pincode" value={address.pincode} onChange={handleChange} />
          {errors.pincode && <p className="field-error">{errors.pincode}</p>}

          <h2>Payment Method</h2>
          <div className="payment-method-options">
            <label className="payment-method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={paymentMethod === 'COD'}
                onChange={() => setPaymentMethod('COD')}
              />
              Cash on Delivery
            </label>
            <label className="payment-method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="Online"
                checked={paymentMethod === 'Online'}
                onChange={() => setPaymentMethod('Online')}
              />
              Pay Online (Razorpay — Cards / UPI / Netbanking)
            </label>
          </div>
          {paymentMethod === 'Online' && (
            <p className="field-note">
              You&apos;ll be redirected to Razorpay&apos;s secure checkout. Your order is placed only after
              payment is verified.
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
            {submitting
              ? paymentMethod === 'Online'
                ? 'Processing payment...'
                : 'Placing order...'
              : paymentMethod === 'Online'
              ? 'Pay Now'
              : 'Place Order'}
          </button>
        </form>

        <div className="checkout-summary">
          <h2>Order Summary</h2>
          {cart.items.map((item) => (
            <div key={item.product._id} className="checkout-summary-row">
              <span>
                {item.product.name} &times; {item.quantity}
              </span>
              <span>{formatCurrency(item.lineTotal)}</span>
            </div>
          ))}
          <div className="checkout-summary-row checkout-summary-total">
            <strong>Total</strong>
            <strong>{formatCurrency(cart.subtotal)}</strong>
          </div>
          <p className="cart-note">The final total is recalculated and confirmed.</p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
