import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const Cart = () => {
  const { cart, loading, error, refreshCart, updateItemQty, removeItem } = useCart();
  const [busyId, setBusyId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    refreshCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQtyChange = async (productId, quantity) => {
    if (quantity < 1) return;
    setBusyId(productId);
    await updateItemQty(productId, quantity);
    setBusyId(null);
  };

  const handleRemove = async (productId) => {
    setBusyId(productId);
    await removeItem(productId);
    setBusyId(null);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refreshCart} />;

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="empty-state">
        <p>Your cart is empty.</p>
        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  const hasBlockingIssues = cart.items.some((i) => i.unavailable || i.exceedsStock);

  return (
    <div className="cart-page">
      <h1>Your Cart</h1>
      <div className="cart-items">
        {cart.items.map((item) => (
          <div key={item.product._id} className="cart-item">
            <div className="cart-item-info">
              <p className="cart-item-name">{item.product.name}</p>
              {item.unavailable && <p className="field-error">This item is no longer available.</p>}
              {!item.unavailable && item.exceedsStock && (
                <p className="field-error">Only {item.product.stock} left in stock — please reduce quantity.</p>
              )}
              {!item.unavailable && <p className="cart-item-price">{formatCurrency(item.product.price)} each</p>}
            </div>

            <div className="cart-item-qty">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={busyId === item.product._id || item.quantity <= 1}
                onClick={() => handleQtyChange(item.product._id, item.quantity - 1)}
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={busyId === item.product._id || item.unavailable}
                onClick={() => handleQtyChange(item.product._id, item.quantity + 1)}
              >
                +
              </button>
            </div>

            <span className="cart-item-line-total">{formatCurrency(item.lineTotal)}</span>

            <button
              type="button"
              className="btn btn-icon-danger"
              aria-label={`Remove ${item.product.name} from cart`}
              disabled={busyId === item.product._id}
              onClick={() => handleRemove(item.product._id)}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-summary-row">
          <span>Subtotal ({cart.totalItems} items)</span>
          <strong>{formatCurrency(cart.subtotal)}</strong>
        </div>
        <p className="cart-note">Final total, including any adjustments, is confirmed at checkout.</p>
        <button
          type="button"
          className="btn btn-primary btn-lg btn-block"
          disabled={hasBlockingIssues}
          onClick={() => navigate('/checkout')}
        >
          Proceed to Checkout
        </button>
        {hasBlockingIssues && (
          <p className="form-error">Resolve the issues above before proceeding to checkout.</p>
        )}
      </div>
    </div>
  );
};

export default Cart;
