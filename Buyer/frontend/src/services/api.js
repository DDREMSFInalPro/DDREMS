/**
 * API Service (Buyer Module)
 * Centralized axios instance with JWT interceptor
 */
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor – attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ddrems_buyer_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor – handle 401 (session expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("ddrems_buyer_token");
      localStorage.removeItem("ddrems_buyer_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ==========================================
// Auth API
// ==========================================
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
};

// ==========================================
// Dashboard API
// ==========================================
export const dashboardAPI = {
  getSummary: () => api.get("/dashboard"),
};

// ==========================================
// Property API (Browse)
// ==========================================
export const propertyAPI = {
  browse: (params) => api.get("/properties", { params }),
  getById: (id) => api.get(`/properties/${id}`),
};

// ==========================================
// Agreement API
// ==========================================
export const agreementAPI = {
  request: (data) => api.post("/agreements", data),
  getAll: (params) => api.get("/agreements", { params }),
  getById: (id) => api.get(`/agreements/${id}`),
  respondToCounter: (id, data) =>
    api.patch(`/agreements/${id}/respond-counter`, data),
};

// ==========================================
// Saved Properties API
// ==========================================
export const savedAPI = {
  getAll: (params) => api.get("/saved", { params }),
  getIds: () => api.get("/saved/ids"),
  save: (propertyId) => api.post(`/saved/${propertyId}`),
  unsave: (propertyId) => api.delete(`/saved/${propertyId}`),
};

// ==========================================
// Payment API
// ==========================================
export const paymentAPI = {
  getAll: (params) => api.get("/payments", { params }),
  submit: (formData) => api.post("/payments/submit", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  getByAgreement: (agreementId) => api.get(`/payments/agreement/${agreementId}`),
};

// ==========================================
// Profile API
// ==========================================
export const profileAPI = {
  get: () => api.get("/profile"),
  update: (formData) =>
    api.put("/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default api;
