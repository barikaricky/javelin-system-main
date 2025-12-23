import axios from 'axios';

const isCodespaces = window.location.hostname.includes('github.dev');
const isProduction = import.meta.env.PROD;

let baseURL: string;
let serverBaseURL: string;

if (isCodespaces) {
  // In Codespaces, use full backend URL since proxy doesn't work across different port URLs
  serverBaseURL = window.location.origin.replace('-3000.', '-3002.');
  baseURL = serverBaseURL + '/api';
} else if (isProduction && import.meta.env.VITE_API_URL) {
  // Production: use environment variable for backend URL (should already include /api)
  baseURL = import.meta.env.VITE_API_URL;
  serverBaseURL = import.meta.env.VITE_API_URL.replace('/api', '');
} else {
  // Development: use local proxy or localhost
  baseURL = import.meta.env.VITE_API_URL || '/api';
  serverBaseURL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3002';
}

console.log('🌐 API Configuration:', {
  environment: isProduction ? 'production' : 'development',
  baseURL,
  serverBaseURL,
  VITE_API_URL: import.meta.env.VITE_API_URL,
});

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds to handle slow operations (registration, file uploads, etc.)
  withCredentials: true, // Enable credentials for CORS
});

// Helper function to get full image URL
export const getImageUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path; // Base64 images
  return `${serverBaseURL}${path}`;
};

// Export server base URL for other uses
export { serverBaseURL };

// Get API base URL for direct axios calls (without /api prefix)
// This is used for bits and locations endpoints which may use a different port
export const getApiBaseURL = (): string => {
  const isCodespaces = window.location.hostname.includes('github.dev');
  
  if (isCodespaces) {
    // In Codespaces, replace port 3000 with 3002
    return window.location.origin.replace('-3000.', '-3002.');
  } else {
    // Check for environment variable first, fallback to default port 3002
    // Priority: VITE_BACKEND_URL > VITE_SERVER_URL (without /api) > default localhost:3002
    if (import.meta.env.VITE_BACKEND_URL) {
      return import.meta.env.VITE_BACKEND_URL;
    }
    if (import.meta.env.VITE_SERVER_URL) {
      // Remove /api suffix if present
      return import.meta.env.VITE_SERVER_URL.replace('/api', '');
    }
    // Default fallback for local development
    return 'http://localhost:3002';
  }
};

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      message: error.message,
    });

    if (error.response?.status === 401) {
      // Only redirect if we're not already on the login page and not on dev pages
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/dev/')) {
        console.warn('🚫 401 Unauthorized - clearing auth and redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('jevelin-auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Default export for convenience
export default api;
