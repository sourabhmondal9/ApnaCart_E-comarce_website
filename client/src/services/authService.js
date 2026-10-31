import api from './api.js';

export const registerUser = async (payload) => {
  const { data } = await api.post('/auth/register', payload);
  return data.data; // { user, token }
};

export const loginUser = async (payload) => {
  const { data } = await api.post('/auth/login', payload);
  return data.data; // { user, token }
};

export const fetchCurrentUser = async () => {
  const { data } = await api.get('/auth/me');
  return data.data.user;
};

export const updateProfile = async (payload) => {
  const { data } = await api.patch('/auth/me', payload);
  return data.data.user;
};
