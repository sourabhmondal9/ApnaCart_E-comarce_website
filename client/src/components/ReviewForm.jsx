import React, { useState, useEffect } from 'react';
import StarRating from './StarRating.jsx';

const ReviewForm = ({ existingReview, onSubmit, submitting, error }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setRating(existingReview?.rating || 0);
    setComment(existingReview?.comment || '');
  }, [existingReview]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating < 1) {
      setValidationError('Please select a star rating');
      return;
    }
    if (comment.trim().length < 5) {
      setValidationError('Review must be at least 5 characters');
      return;
    }
    setValidationError('');
    onSubmit({ rating, comment: comment.trim() });
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>{existingReview ? 'Edit Your Review' : 'Write a Review'}</h3>
      {(validationError || error) && <p className="form-error">{validationError || error}</p>}

      <label>Your Rating</label>
      <StarRating value={rating} onChange={setRating} size={24} />

      <label htmlFor="review-comment">Your Review</label>
      <textarea
        id="review-comment"
        rows={4}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience with this product..."
      />

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
      </button>
    </form>
  );
};

export default ReviewForm;
