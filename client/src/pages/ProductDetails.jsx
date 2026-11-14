import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { fetchProductById } from '../services/productService.js';
import { fetchProductReviews, fetchMyReviewForProduct, submitReview, deleteReview } from '../services/reviewService.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import StarRating from '../components/StarRating.jsx';
import ReviewForm from '../components/ReviewForm.jsx';
import ReviewList from '../components/ReviewList.jsx';

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
  const { isAuthenticated, user, isAdmin } = useAuth();
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [deletingReviewId, setDeletingReviewId] = useState(null);

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

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const data = await fetchProductReviews(id);
      setReviews(data.reviews);
      if (isAuthenticated) {
        const mine = await fetchMyReviewForProduct(id);
        setMyReview(mine);
      } else {
        setMyReview(null);
      }
    } catch {
      // non-critical: review section just shows what it could load
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadReviews();
    setQuantity(1);
    setFeedback(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated]);

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

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      setFeedback({ type: 'error', text: 'Please log in to save items to your wishlist.' });
      return;
    }
    await toggleWishlist(product._id);
  };

  const handleReviewSubmit = async ({ rating, comment }) => {
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const saved = await submitReview(id, { rating, comment });
      setMyReview(saved);
      await loadReviews();
    } catch (err) {
      setReviewError(err.details ? err.details.join(', ') : err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleReviewDelete = async (reviewId) => {
    setDeletingReviewId(reviewId);
    try {
      await deleteReview(id, reviewId);
      if (myReview?._id === reviewId) setMyReview(null);
      await loadReviews();
    } catch {
      // review list just stays as-is if the delete failed
    } finally {
      setDeletingReviewId(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!product) return <ErrorMessage message="Product not found." />;

  const outOfStock = product.stock <= 0;
  const wishlisted = isWishlisted(product._id);

  return (
    <div className="product-details-page">
      <Link to="/products" className="back-link">
        &larr; Back to products
      </Link>
      <div className="product-details-grid">
        <div className="product-details-image-wrap">
          <img
            src={product.imageUrl || FALLBACK_IMAGE}
            alt={product.name}
            className="product-details-image"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
          <button
            type="button"
            className={`wishlist-toggle wishlist-toggle-large ${wishlisted ? 'wishlist-toggle-active' : ''}`}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={handleWishlistToggle}
          >
            <Heart size={20} fill={wishlisted ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
        </div>
        <div className="product-details-info">
          <p className="product-card-category">
            {product.category?.parentCategory ? `${product.category.parentCategory.name} / ` : ''}
            {product.category?.name}
          </p>
          <h1>{product.name}</h1>
          {product.ratingsCount > 0 && (
            <StarRating value={product.ratingsAverage} count={product.ratingsCount} size={18} showValue />
          )}
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

          <div className="product-details-actions">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              disabled={outOfStock || adding}
              onClick={handleAddToCart}
            >
              <ShoppingCart size={18} aria-hidden="true" />
              {adding ? 'Adding...' : outOfStock ? 'Unavailable' : 'Add to Cart'}
            </button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={handleWishlistToggle}>
              <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} aria-hidden="true" />
              {wishlisted ? 'Saved' : 'Save for Later'}
            </button>
          </div>

          {feedback && (
            <p className={feedback.type === 'error' ? 'form-error' : 'form-success'}>{feedback.text}</p>
          )}
        </div>
      </div>

      <section className="section reviews-section">
        <h2>Customer Reviews</h2>
        {reviewsLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="reviews-layout">
            <ReviewList
              reviews={reviews}
              currentUserId={user?._id}
              isAdmin={isAdmin}
              onDelete={handleReviewDelete}
              deletingId={deletingReviewId}
            />
            {isAuthenticated ? (
              <ReviewForm
                existingReview={myReview}
                onSubmit={handleReviewSubmit}
                submitting={reviewSubmitting}
                error={reviewError}
              />
            ) : (
              <p className="field-note">
                <Link to="/login">Log in</Link> to write a review.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProductDetails;
