import api from './api.js';

export const fetchWishlist = async () => {
  const { data } = await api.get('/wishlist');
  return data.data.products;
};

export const fetchWishlistIds = async () => {
  const { data } = await api.get('/wishlist/ids');
  return data.data.productIds;
};

export const addToWishlist = async (productId) => {
  const { data } = await api.post('/wishlist/items', { productId });
  return data.data.productIds;
};

export const removeFromWishlist = async (productId) => {
  const { data } = await api.delete(`/wishlist/items/${productId}`);
  return data.data.productIds;
};
