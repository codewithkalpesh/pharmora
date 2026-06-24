import axios from 'axios';

const API_URL = '/api';

const VITE_API_URL = import.meta.env.VITE_API_URL;
const baseURL = VITE_API_URL 
  ? (VITE_API_URL.endsWith('/') ? `${VITE_API_URL}api` : `${VITE_API_URL}/api`)
  : '/api';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
};

export default api;
