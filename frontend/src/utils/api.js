import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 120000, // 2 min — Render free tier takes up to 90s to wake from sleep
});

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rxtoken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rxtoken');
      localStorage.removeItem('rxuser');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
