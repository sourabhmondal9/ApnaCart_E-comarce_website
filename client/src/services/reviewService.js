import api from './api.js';

export const fetchProductReviews = async (productId, params = {}) => {
  const { data } = await api.get(`/products/${productId}/reviews`, { params });
  return data.data; // { reviews, pagination }
};

export const fetchMyReviewForProduct = async (productId) => {
  const { data } = await api.get(`/products/${productId}/reviews/mine`);
  return data.data.review; // null if the user hasn't reviewed it
};

export const submitReview = async (productId, payload) => {
  const { data } = await api.post(`/products/${productId}/reviews`, payload);
  return data.data.review;
};

export const deleteReview = async (productId, reviewId) => {
  const { data } = await api.delete(`/products/${productId}/reviews/${reviewId}`);
  return data;
};
