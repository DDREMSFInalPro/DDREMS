/**
 * API Service (Admin Module)
 */
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ddrems_admin_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("ddrems_admin_token");
      localStorage.removeItem("ddrems_admin_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  login: (data) => api.post("/auth/login", data),
};

export const dashboardAPI = {
  getSummary: () => api.get("/dashboard"),
};

export const userAPI = {
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  toggleActive: (id) => api.patch(`/users/${id}/toggle-active`),
};

export const propertyAPI = {
  getAll: (params) => api.get("/properties", { params }),
  getById: (id) => api.get(`/properties/${id}`),
  togglePublish: (id) => api.patch(`/properties/${id}/toggle-publish`),
};

export const agreementAPI = {
  getAll: (params) => api.get("/agreements", { params }),
  getById: (id) => api.get(`/agreements/${id}`),
  getPayment: (id) => api.get(`/agreements/${id}/payment`),
  addNote: (id, data) => api.patch(`/agreements/${id}/note`, data),
  generatePDF: (id) => api.post(`/agreements/${id}/generate-pdf`),
  forwardToOwner: (id, data) => api.patch(`/agreements/${id}/forward`, data),
  sendCounterOfferToBuyer: (id, data) => api.patch(`/agreements/${id}/send-counter-offer`, data),
  forwardBuyerCounterToOwner: (id, data) => api.patch(`/agreements/${id}/forward-buyer-counter`, data),
  approveBuyerAcceptance: (id, data) => api.patch(`/agreements/${id}/approve-buyer-acceptance`, data),
  askOwnerPayment: (id, data) => api.patch(`/agreements/${id}/ask-owner-payment`, data),
  verifyPayment: (id) => api.patch(`/agreements/${id}/verify-payment`, {}),
};

export const paymentAPI = {
  getAll:           (params) => api.get("/payments", { params }),
  getCommission:    () => api.get("/payments/commission"),
  getWithdrawals:   (params) => api.get("/payments/withdrawals", { params }),
  updateWithdrawal: (id, data) => api.patch(`/payments/withdrawals/${id}`, data),
};

export const profileAPI = {
  get: () => api.get("/profile"),
  update: (formData) =>
    api.put("/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default api;
