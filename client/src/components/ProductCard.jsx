import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency.js';

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" font-size="20" text-anchor="middle" fill="#9ca3af" font-family="sans-serif">No Image</text></svg>`
  );

const ProductCard = ({ product, onAddToCart, adding }) => {
  const outOfStock = product.stock <= 0;

  return (
    <div className="product-card">
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
