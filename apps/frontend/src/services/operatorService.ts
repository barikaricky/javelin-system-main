import { api } from '../lib/api';

export interface Operator {
  id: string;
  userId: string;
  employeeId: string;
  fullName: string;
  salary: number;
  salaryCategory?: string;
  allowance?: number;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt?: string;
  users: {
    id: string;
    email: string;
    phone?: string;
    firstName: string;
    lastName: string;
    status: string;
    profilePhoto?: string;
    passportPhoto?: string;
    state?: string;
    lga?: string;
    address?: string;
    gender?: string;
    dateOfBirth?: string;
    createdAt?: string;
  };
  locations?: {
    id: string;
    name: string;
    address: string;
  };
  supervisor?: {
    id: string;
    users: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface OperatorStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
}

export const operatorService = {
  async getAll(params?: any): Promise<Operator[]> {
    const response = await api.get('/managers/operators', { params });
    return response.data.operators || [];
  },

  async getStats(): Promise<OperatorStats> {
    const response = await api.get('/managers/operators/stats');
    return response.data;
  },

  async getById(id: string): Promise<Operator> {
    const response = await api.get(`/managers/operators/${id}`);
    return response.data.operator;
  },
};
