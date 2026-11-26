import axios from 'axios';

// One shared Axios instance. Components never call axios or fetch directly.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 15000 });

// Request interceptor: attach the JWT
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Response interceptor: unwrap { success, data, meta } and normalize errors to
// { status, code, message, details }. A 401 anywhere (except login) logs the user out.
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status;
    const body = err.response?.data?.error || {};
    const url = err.config?.url || '';
    if (status === 401 && !url.includes('/auth/login') && !url.includes('/auth/me/password')) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:logout')); // AuthContext listens and dispatches LOGOUT
    }
    return Promise.reject({
      status,
      code: body.code || (err.code === 'ECONNABORTED' ? 'TIMEOUT' : 'NETWORK_ERROR'),
      message: body.message || 'Network error, check your connection',
      details: body.details || [],
    });
  }
);

export default api;
