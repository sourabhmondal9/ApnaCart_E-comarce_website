import React from 'react';
import { Star } from 'lucide-react';

/**
 * Display-only star rating (half-star rendering via a clipped overlay)
 * when `onChange` is omitted. Pass `onChange` to turn it into an
 * interactive 1-5 star picker for the review form.
 */
const StarRating = ({ value = 0, onChange, size = 16, showValue = false, count }) => {
  const isInteractive = typeof onChange === 'function';
  const stars = [1, 2, 3, 4, 5];

  return (
    <span className={`star-rating ${isInteractive ? 'star-rating-interactive' : ''}`}>
      {stars.map((star) => {
        const filled = star <= Math.round(value);
        return (
          <button
            key={star}
            type={isInteractive ? 'button' : undefined}
            className="star-rating-star"
            disabled={!isInteractive}
            aria-label={isInteractive ? `Rate ${star} out of 5 stars` : undefined}
            onClick={isInteractive ? () => onChange(star) : undefined}
          >
            <Star
              size={size}
              fill={filled ? '#f59e0b' : 'none'}
              color={filled ? '#f59e0b' : '#cbd5e1'}
              aria-hidden="true"
            />
          </button>
        );
      })}
      {showValue && (
        <span className="star-rating-value">
          {value > 0 ? value.toFixed(1) : 'No ratings yet'}
          {typeof count === 'number' && count > 0 ? ` (${count})` : ''}
        </span>
      )}
    </span>
  );
};

export default StarRating;
