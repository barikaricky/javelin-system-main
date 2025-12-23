import { api } from '../lib/api';

interface LoginData {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'DEVELOPER' | 'DIRECTOR' | 'MANAGER' | 'GENERAL_SUPERVISOR' | 'SUPERVISOR' | 'OPERATOR' | 'SECRETARY';
    phone?: string;
    profilePhoto?: string;
  };
}

interface CreateDirectorData {
  developerToken: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface CreateDirectorResponse {
  user: {
    id: string;
    email: string;
    role: string;
    employeeId: string;
  };
  temporaryPassword: string;
}

export const authService = {
  async login(data: LoginData): Promise<LoginResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async createDirector(data: CreateDirectorData): Promise<CreateDirectorResponse> {
    const response = await api.post('/onboarding/director', data);
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async logout() {
    localStorage.removeItem('token');
  },
};
