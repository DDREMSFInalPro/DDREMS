import axios from 'axios';

// Session inactivity timeout — must match backend SESSION_TIMEOUT_MINUTES (default 15)
const SESSION_TIMEOUT_MS = parseInt(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES || '15', 10) * 60 * 1000;

let lastActivityTime = Date.now();
let inactivityTimer = null;

/** Reset the inactivity clock on any user interaction */
const resetActivity = () => {
  lastActivityTime = Date.now();
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    // Proactively clear token and redirect before the next API call fails
    localStorage.removeItem('token');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login?reason=timeout';
    }
  }, SESSION_TIMEOUT_MS);
};

// Track user activity events
if (typeof window !== 'undefined') {
  ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'].forEach((evt) => {
    window.addEventListener(evt, resetActivity, { passive: true });
  });
  resetActivity(); // start the timer immediately
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// ── Request interceptor — attach JWT + last-activity timestamp ───────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Tell the server when the user was last active so it can enforce timeout
      config.headers['X-Last-Activity'] = String(lastActivityTime);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — normalize errors, handle 401 / session timeout ───
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('/login')) {
          const reason = data?.code === 'SESSION_TIMEOUT' ? 'timeout' : 'unauthorized';
          window.location.href = `/login?reason=${reason}`;
        }
      }

      const message =
        data?.message ||
        (status === 403 ? 'You do not have permission to perform this action.' :
         status === 404 ? 'The requested resource was not found.' :
         status === 429 ? 'Too many requests. Please slow down and try again.' :
         status >= 500 ? 'A server error occurred. Please try again later.' :
         'An unexpected error occurred.');

      return Promise.reject(new Error(message));
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out. Please check your connection.'));
    }

    if (!error.response) {
      return Promise.reject(new Error('Unable to reach the server. Please check your connection.'));
    }

    return Promise.reject(error);
  }
);

export default api;
