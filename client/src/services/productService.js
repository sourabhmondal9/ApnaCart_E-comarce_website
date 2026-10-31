import api from './api.js';

export const fetchProducts = async (params = {}) => {
  const { data } = await api.get('/products', { params });
  return data.data; // { products, pagination }
};

export const fetchProductById = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data.data.product;
};

export const createProduct = async (payload) => {
  const { data } = await api.post('/products', payload);
  return data.data.product;
};

export const updateProduct = async (id, payload) => {
  const { data } = await api.put(`/products/${id}`, payload);
  return data.data.product;
};

export const deleteProduct = async (id) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};
