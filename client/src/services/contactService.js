import api from './api.js';

export const sendContactMessage = async (payload) => {
  const { data } = await api.post('/contact', payload);
  return data; // { success, message, data: { id } }
};

// --- Admin-only ---

export const fetchContactMessages = async (params = {}) => {
  const { data } = await api.get('/contact', { params });
  return data.data; // { messages, unresolvedCount, pagination }
};

export const setMessageResolved = async (id, isResolved) => {
  const { data } = await api.patch(`/contact/${id}/resolve`, { isResolved });
  return data.data.message;
};

export const deleteContactMessage = async (id) => {
  const { data } = await api.delete(`/contact/${id}`);
  return data;
};
