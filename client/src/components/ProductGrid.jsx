import React from 'react';
import ProductCard from './ProductCard.jsx';

const ProductGrid = ({ products, onAddToCart, addingId, onWishlistMessage }) => {
  if (!products || products.length === 0) {
    return (
      <div className="empty-state">
        <p>No products found.</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          onAddToCart={onAddToCart}
          adding={addingId === product._id}
          onWishlistMessage={onWishlistMessage}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
