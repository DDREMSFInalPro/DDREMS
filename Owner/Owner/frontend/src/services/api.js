/**
 * API Service
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
    const token = localStorage.getItem("ddrems_token");
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
      localStorage.removeItem("ddrems_token");
      localStorage.removeItem("ddrems_user");
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
// Property API
// ==========================================
export const propertyAPI = {
  getAll: (params) => api.get("/properties/owner", { params }),
  getById: (id) => api.get(`/properties/${id}`),
  create: (formData) =>
    api.post("/properties", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, formData) =>
    api.put(`/properties/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/properties/${id}`),
  togglePublish: (id) => api.post(`/properties/${id}/publish`),
};

// ==========================================
// Payment API
// ==========================================
export const paymentAPI = {
  getAll: (params) => api.get("/payments/owner", { params }),
  getByAgreement: (agreementId) =>
    api.get(`/payments/agreement/${agreementId}`),
};

// ==========================================
// Agreement API
// ==========================================
export const agreementAPI = {
  getAll: (params) => api.get("/agreements", { params }),
  getById: (id) => api.get(`/agreements/${id}`),
  respond: (id, data) => api.patch(`/agreements/${id}/respond`, data),
  confirmPayment: (id, data) =>
    api.patch(`/agreements/${id}/confirm-payment`, data),
};

export const formalAgreementAPI = {
  getAll: () => api.get("/formal-agreements"),
  getByNegotiation: (negotiationId) =>
    api.get(`/formal-agreements/by-negotiation/${negotiationId}`),
  getById: (id) => api.get(`/formal-agreements/${id}`),
  sign: (id) => api.patch(`/formal-agreements/${id}/sign`),
};

// ==========================================
// AI Price API
// ==========================================
export const aiAPI = {
  getRecommendation: (params) => api.get("/price-recommendation", { params }),
};

// ==========================================
// Document API (Ownership Certificates)
// ==========================================
export const documentAPI = {
  upload: (propertyId, formData) =>
    api.post(`/documents/${propertyId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getAll: (propertyId) => api.get(`/documents/${propertyId}`),
  getDownloadUrl: (documentId, accessKey) =>
    `/api/documents/download/${documentId}?key=${accessKey}`,
  delete: (documentId) => api.delete(`/documents/${documentId}`),
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
