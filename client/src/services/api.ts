import axios from 'axios';
import toast from 'react-hot-toast';
import { t } from '../i18n';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      (error.message === 'Network Error' ? t('networkError') : error.message);

    if (error.response?.status === 401) {
      const isLogin = error.config?.url?.includes('/auth/login');
      if (!isLogin) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;

export function handleApiError(error: unknown) {
  const message = error instanceof Error ? error.message : 'حدث خطأ';
  toast.error(message);
  return message;
}
