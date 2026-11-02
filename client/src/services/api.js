import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL });

// Attach the JWT (if present) to every outgoing request.
// NOTE on token storage: this demo stores the JWT in localStorage for
// simplicity, which is standard for a college project but has a real
// trade-off — any XSS on the page can read localStorage and steal the
// token. A production app would prefer an HttpOnly, Secure cookie issued
// by the server so client-side JS can never read the token directly.
// We mitigate XSS risk here by never using dangerouslySetInnerHTML and
// relying on React's default escaping everywhere.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize errors into a simple { message, details, status } shape so
// components don't need to know about axios internals.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    let payload = error.response?.data;

    // requests made with responseType: 'blob' (e.g. invoice download) get
    // their error body back as a Blob too, not parsed JSON — decode it
    // here so callers still get a readable error message.
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
