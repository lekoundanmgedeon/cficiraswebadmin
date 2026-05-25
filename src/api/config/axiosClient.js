// config/axiosClient.js
import axios from 'axios';

// config/axiosClient.js
export const createApiClient = (prefix = '', useJson = true) => {
  const instance = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api${prefix}`,
    // On garde un objet vide si useJson est false
    headers: useJson ? { 'Content-Type': 'application/json' } : {},
  });

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
    return config;
  });

  return instance;
};
