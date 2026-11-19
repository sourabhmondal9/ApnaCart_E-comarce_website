import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    let payload = error.response?.data;

    if (payload instanceof Blob && payload.type === 'application/json') {
      try {
        payload = JSON.parse(await payload.text());
      } catch {
        payload = null;
      }
    }

    const message = payload?.message || error.message || 'Something went wrong';
    const details = payload?.details || null;

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    return Promise.reject({ status, message, details });
  }
);

export default api;
