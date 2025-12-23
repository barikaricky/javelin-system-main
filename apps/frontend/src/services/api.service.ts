import axios from 'axios';

const isCodespaces = typeof window !== 'undefined' && window.location.hostname.includes('github.dev');

let API_BASE_URL: string;
if (isCodespaces) {
  const backendURL = window.location.origin.replace('-3000.', '-3002.');
  API_BASE_URL = backendURL + '/api';
} else {
  API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
}

console.log('🔧 API Service Base URL:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ManagerRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  startDate: string;
}

export interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: string;
  startDate: string;
  createdAt: string;
}

export interface SecretaryRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  startDate: string;
}

export const managerApi = {
  register: async (data: ManagerRegistrationData | FormData) => {
    const config = data instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    
    const response = await apiClient.post('/director/register-manager', data, config);
    return response.data;
  },

  getAll: async () => {
    const response = await apiClient.get('/director/managers');
    return response.data;
  },
};

export const secretaryApi = {
  register: async (data: SecretaryRegistrationData | FormData) => {
    const config = data instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    
    const response = await apiClient.post('/manager/register-secretary', data, config);
    return response.data;
  },

  getAll: async () => {
    const response = await apiClient.get('/manager/secretaries');
    return response.data;
  },
};

export default apiClient;
