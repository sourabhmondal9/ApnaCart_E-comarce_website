import api from './api.js';

export const fetchCart = async () => {
  const { data } = await api.get('/cart');
  return data.data; // { items, subtotal, totalItems }
};

export const addToCart = async (productId, quantity = 1) => {
  const { data } = await api.post('/cart/items', { productId, quantity });
  return data.data;
};

export const updateCartItemQty = async (productId, quantity) => {
  const { data } = await api.patch(`/cart/items/${productId}`, { quantity });
  return data.data;
};

export const removeFromCart = async (productId) => {
  const { data } = await api.delete(`/cart/items/${productId}`);
  return data.data;
};

export const clearCart = async () => {
  const { data } = await api.delete('/cart');
  return data.data;
};
