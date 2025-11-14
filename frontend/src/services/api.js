import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, fullName) => api.post('/auth/register', { email, password, fullName }),
  demoLogin: () => api.post('/auth/demo-login'),
};

// Invoices API
export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  upload: (file) => {
    const formData = new FormData();
    formData.append('invoice', file);
    return api.post('/invoices/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
};

// Chat API
export const chatAPI = {
  sendMessage: (message) => api.post('/chat', { message }),
  getHistory: (limit = 50) => api.get('/chat/history', { params: { limit } }),
  clearHistory: () => api.delete('/chat/history'),
};

// Analytics API
export const analyticsAPI = {
  getSummary: (params) => api.get('/analytics/summary', { params }),
  getByCategory: (params) => api.get('/analytics/by-category', { params }),
  getByVendor: (params) => api.get('/analytics/by-vendor', { params }),
  getMonthlyTrend: (months = 12) => api.get('/analytics/monthly-trend', { params: { months } }),
  getTaxReport: (params) => api.get('/analytics/tax-report', { params }),
  getTopExpenses: (limit = 10) => api.get('/analytics/top-expenses', { params: { limit } }),
};

export default api;
