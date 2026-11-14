import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency.js';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import StarRating from './StarRating.jsx';

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" font-size="20" text-anchor="middle" fill="#9ca3af" font-family="sans-serif">No Image</text></svg>`
  );

const ProductCard = ({ product, onAddToCart, adding, onWishlistMessage }) => {
  const outOfStock = product.stock <= 0;
  const { isAuthenticated } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product._id);

  const handleWishlistClick = async (e) => {
    e.preventDefault(); // inside a <Link>-adjacent card, don't navigate
    if (!isAuthenticated) {
      onWishlistMessage?.('Please log in to save items to your wishlist.');
      return;
    }
    const res = await toggleWishlist(product._id);
    if (!res.success) onWishlistMessage?.(res.message);
  };

  return (
    <div className="product-card">
      <div className="product-card-image-link">
        <Link to={`/products/${product._id}`}>
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
        <button
          type="button"
          className={`wishlist-toggle ${wishlisted ? 'wishlist-toggle-active' : ''}`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={handleWishlistClick}
        >
          <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </div>
      <div className="product-card-body">
        <p className="product-card-category">{product.category?.name || 'Uncategorized'}</p>
        <Link to={`/products/${product._id}`} className="product-card-name">
          {product.name}
        </Link>
        {product.ratingsCount > 0 && (
          <StarRating value={product.ratingsAverage} count={product.ratingsCount} size={13} showValue />
        )}
        <div className="product-card-footer">
          <span className="product-card-price">{formatCurrency(product.price)}</span>
          {outOfStock ? (
            <span className="badge badge-danger">Out of stock</span>
          ) : (
            <span className="badge badge-success">In stock</span>
          )}
        </div>
        {onAddToCart && (
          <button
            type="button"
            className="btn btn-primary btn-sm btn-block"
            disabled={outOfStock || adding}
            onClick={() => onAddToCart(product)}
          >
            <ShoppingCart size={16} aria-hidden="true" />
            {adding ? 'Adding...' : outOfStock ? 'Unavailable' : 'Add to Cart'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
