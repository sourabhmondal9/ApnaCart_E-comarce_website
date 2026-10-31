import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { fetchProductById } from '../services/productService.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" font-size="22" text-anchor="middle" fill="#9ca3af" font-family="sans-serif">No Image</text></svg>`
  );

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProductById(id);
      setProduct(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    setQuantity(1);
    setFeedback(null);
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setFeedback({ type: 'error', text: 'Please log in to add items to your cart.' });
      return;
    }
    setAdding(true);
    const res = await addItem(product._id, quantity);
    setAdding(false);
    setFeedback(
      res.success
        ? { type: 'success', text: `${quantity} x ${product.name} added to cart.` }
        : { type: 'error', text: res.message }
    );
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!product) return <ErrorMessage message="Product not found." />;

  const outOfStock = product.stock <= 0;

  return (
    <div className="product-details-page">
      <Link to="/products" className="back-link">
        &larr; Back to products
      </Link>
      <div className="product-details-grid">
        <img
          src={product.imageUrl || FALLBACK_IMAGE}
          alt={product.name}
          className="product-details-image"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
        <div className="product-details-info">
          <p className="product-card-category">{product.category?.name}</p>
          <h1>{product.name}</h1>
          <p className="product-details-price">{formatCurrency(product.price)}</p>
          <p className="product-details-description">{product.description}</p>
          <p>
            {outOfStock ? (
              <span className="badge badge-danger">Out of stock</span>
            ) : (
              <span className="badge badge-success">{product.stock} in stock</span>
            )}
          </p>

          {!outOfStock && (
            <div className="quantity-selector">
              <label htmlFor="qty">Quantity</label>
              <input
                id="qty"
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(product.stock, Number(e.target.value) || 1));
                  setQuantity(v);
                }}
              />
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary btn-lg"
            disabled={outOfStock || adding}
            onClick={handleAddToCart}
          >
            <ShoppingCart size={18} aria-hidden="true" />
            {adding ? 'Adding...' : outOfStock ? 'Unavailable' : 'Add to Cart'}
          </button>

          {feedback && (
            <p className={feedback.type === 'error' ? 'form-error' : 'form-success'}>{feedback.text}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
