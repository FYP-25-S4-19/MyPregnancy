import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Functions
export const websiteAPI = {
  getPublicPages: () => api.get('/website/pages/public'),
  getPublicPage: (slug: string) => api.get(`/website/pages/public/${slug}`),
  getAllPages: () => api.get('/website/pages'),
  getPage: (slug: string) => api.get(`/website/pages/${slug}`),
  createPage: (data: any) => api.post('/website/pages', data),
  updatePage: (slug: string, data: any) => api.put(`/website/pages/${slug}`, data),
  deletePage: (slug: string) => api.delete(`/website/pages/${slug}`),
};

export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/jwt/login', { username: email, password }),
  logout: () => api.post('/auth/jwt/logout'),
  getMe: () => api.get('/users/me'),
};

export const usersAPI = {
  getAllUsers: () => api.get('/users'),
  getUser: (id: number) => api.get(`/users/${id}`),
  updateUser: (id: number, data: any) => api.patch(`/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/users/${id}`),
};

export const appointmentsAPI = {
  getAllAppointments: () => api.get('/appointments'),
  getAppointment: (id: number) => api.get(`/appointments/${id}`),
  updateAppointment: (id: number, data: any) => api.patch(`/appointments/${id}`, data),
};