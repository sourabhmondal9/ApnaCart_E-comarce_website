import React from 'react';
import { Trash2, BadgeCheck } from 'lucide-react';
import StarRating from './StarRating.jsx';

const ReviewList = ({ reviews, currentUserId, isAdmin, onDelete, deletingId }) => {
  if (!reviews || reviews.length === 0) {
    return <p className="field-note">No reviews yet. Be the first to review this product.</p>;
  }

  return (
    <div className="review-list">
      {reviews.map((review) => {
        const canDelete = isAdmin || review.user?._id === currentUserId;
        return (
          <div key={review._id} className="review-item">
            <div className="review-item-header">
              <div>
                <strong>{review.user?.name || 'Anonymous'}</strong>
                {review.isVerifiedPurchase && (
                  <span className="verified-badge">
                    <BadgeCheck size={14} aria-hidden="true" /> Verified Purchase
                  </span>
                )}
              </div>
              <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
            <StarRating value={review.rating} size={14} />
            <p className="review-comment">{review.comment}</p>
            {canDelete && (
              <button
                type="button"
                className="btn btn-icon-danger btn-sm"
                aria-label="Delete review"
                disabled={deletingId === review._id}
                onClick={() => onDelete(review._id)}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ReviewList;
