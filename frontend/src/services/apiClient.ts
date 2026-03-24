import axios from 'axios';

// Strip a trailing /api so that request paths like '/api/billing/...' are never doubled.
const rawBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000';
const baseURL = rawBase.replace(/\/api\/?$/, '');

export const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage (use access_token which is set by authService)
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log errors but don't auto-logout - let the component handle it
    if (error.response?.status === 401) {
      console.error('Authentication error:', error.response.data);
    }
    return Promise.reject(error);
  }
);
