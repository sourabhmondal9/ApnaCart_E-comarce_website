import ApiError from '../utils/ApiError.js';

export const validateReviewInput = (body) => {
  const errors = [];
  const { rating, comment } = body;

  const r = Number(rating);
  if (rating === undefined || rating === null || !Number.isInteger(r) || r < 1 || r > 5) {
    errors.push('Rating must be a whole number between 1 and 5');
  }
  if (!comment || typeof comment !== 'string' || comment.trim().length < 5) {
    errors.push('Comment must be at least 5 characters');
  }

  if (errors.length) throw new ApiError(400, 'Invalid review data', errors);
};
