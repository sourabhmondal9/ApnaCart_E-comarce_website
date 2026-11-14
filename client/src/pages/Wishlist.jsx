import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { fetchWishlist } from '../services/wishlistService.js';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" font-size="14" text-anchor="middle" fill="#9ca3af" font-family="sans-serif">No Image</text></svg>`
  );

const Wishlist = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');
  const { toggleWishlist } = useWishlist();
  const { addItem } = useCart();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWishlist();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRemove = async (productId) => {
    setBusyId(productId);
    await toggleWishlist(productId); // product is already wishlisted, so this removes it
    setProducts((prev) => prev.filter((p) => p._id !== productId));
    setBusyId(null);
  };

  const handleAddToCart = async (product) => {
    setBusyId(product._id);
    const res = await addItem(product._id, 1);
    setBusyId(null);
    setToast(res.success ? `${product.name} added to cart` : res.message);
    setTimeout(() => setToast(''), 2500);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <Heart size={32} aria-hidden="true" />
        <p>Your wishlist is empty.</p>
        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      {toast && <div className="toast">{toast}</div>}
      <h1>My Wishlist</h1>
      <div className="product-grid">
        {products.map((product) => {
          const outOfStock = !product.isActive || product.stock <= 0;
          return (
            <div className="product-card" key={product._id}>
              <Link to={`/products/${product._id}`} className="product-card-image-link">
                <img
                  src={product.imageUrl || FALLBACK_IMAGE}
                  alt={product.name}
                  className="product-card-image"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
              </Link>
              <div className="product-card-body">
                <p className="product-card-category">{product.category?.name || 'Uncategorized'}</p>
                <Link to={`/products/${product._id}`} className="product-card-name">
                  {product.name}
                </Link>
                <div className="product-card-footer">
                  <span className="product-card-price">{formatCurrency(product.price)}</span>
                  {outOfStock ? (
                    <span className="badge badge-danger">Unavailable</span>
                  ) : (
                    <span className="badge badge-success">In stock</span>
                  )}
                </div>
                <div className="wishlist-card-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={outOfStock || busyId === product._id}
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart size={14} aria-hidden="true" /> Add to Cart
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon-danger"
                    aria-label={`Remove ${product.name} from wishlist`}
                    disabled={busyId === product._id}
                    onClick={() => handleRemove(product._id)}
                  >
                    <Heart size={16} fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Wishlist;
