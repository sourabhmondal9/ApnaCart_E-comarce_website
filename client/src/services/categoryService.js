import api from './api.js';

export const fetchCategories = async (params = {}) => {
  const { data } = await api.get('/categories', { params });
  return data.data.categories;
};

export const createCategory = async (payload) => {
  const { data } = await api.post('/categories', payload);
  return data.data.category;
};

export const updateCategory = async (id, payload) => {
  const { data } = await api.put(`/categories/${id}`, payload);
  return data.data.category;
};

export const deleteCategory = async (id) => {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
};
