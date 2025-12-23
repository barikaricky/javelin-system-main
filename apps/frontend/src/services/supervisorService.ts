import { api } from '../lib/api';

export interface SupervisorCredentials {
  username: string;
  employeeId: string;
  temporaryPassword: string;
  email: string;
}

export interface GeneralSupervisorFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  state: string;
  lga: string;
  nationalId?: string;
  passportPhoto?: string;
  
  // Work Information
  supervisorType: 'GENERAL_SUPERVISOR';
  startDate: string;
  
  // Salary Information
  salary: number;
  salaryCategory: string;
  allowance?: number;
  bankName: string;
  bankAccountNumber: string;
  
  // General Supervisor Specific
  regionAssigned: string;
  subordinateSupervisorIds?: string[];
  expectedVisitFrequency: string;
  reportSubmissionType: string;
  escalationRights: string;
}

export interface SupervisorFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  state: string;
  lga: string;
  nationalId?: string;
  passportPhoto?: string;
  
  // Work Information
  supervisorType: 'SUPERVISOR';
  startDate: string;
  
  // Salary Information
  salary: number;
  salaryCategory: string;
  allowance?: number;
  bankName: string;
  bankAccountNumber: string;
  
  // Supervisor Specific
  locationId?: string;
  locationsAssigned: string[];
  bitsAssigned: string[];
  generalSupervisorId?: string;
  visitSchedule: string;
  shiftType: string;
  isMotorbikeOwner?: boolean;
  transportAllowanceEligible?: boolean;
}

export type SupervisorRegistrationData = GeneralSupervisorFormData | SupervisorFormData;

export interface Supervisor {
  id: string;
  userId: string;
  employeeId: string;
  fullName: string;
  supervisorType: 'GENERAL_SUPERVISOR' | 'SUPERVISOR';
  salary: number;
  salaryCategory?: string;
  allowance?: number;
  regionAssigned?: string;
  bitsAssigned: string[];
  locationsAssigned: string[];
  visitSchedule?: string;
  shiftType?: string;
  generalSupervisorId?: string;
  operatorCount?: number;
  subordinateSupervisorCount?: number;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedAt?: string;
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
    createdById?: string;
    createdAt?: string;
  };
  locations?: {
    id: string;
    name: string;
    address: string;
  };
  generalSupervisor?: {
    id: string;
    users: {
      firstName: string;
      lastName: string;
    };
  };
  registeredBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface SupervisorStats {
  total: number;
  generalSupervisors: number;
  supervisors: number;
  active: number;
  inactive: number;
  pending?: number;
}

export interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  pendingGeneral: number;
  pendingSupervisor: number;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  region?: string;
}

export const supervisorService = {
  // Register a new supervisor
  async register(data: SupervisorRegistrationData): Promise<{
    message: string;
    supervisor: { id: string; userId: string; fullName: string; supervisorType: string };
    credentials: SupervisorCredentials;
  }> {
    const response = await api.post('/supervisors/register', data);
    return response.data;
  },

  // Get all supervisors
  async getAll(filters?: {
    supervisorType?: 'GENERAL_SUPERVISOR' | 'SUPERVISOR';
    regionAssigned?: string;
    generalSupervisorId?: string;
    status?: string;
  }): Promise<Supervisor[]> {
    const params = new URLSearchParams();
    if (filters?.supervisorType) params.append('supervisorType', filters.supervisorType);
    if (filters?.regionAssigned) params.append('regionAssigned', filters.regionAssigned);
    if (filters?.generalSupervisorId) params.append('generalSupervisorId', filters.generalSupervisorId);
    if (filters?.status) params.append('status', filters.status);
    
    const response = await api.get(`/supervisors?${params.toString()}`);
    return response.data;
  },

  // Get supervisor by ID
  async getById(id: string): Promise<Supervisor> {
    const response = await api.get(`/supervisors/${id}`);
    return response.data;
  },

  // Get all general supervisors (for dropdown)
  async getGeneralSupervisors(): Promise<Supervisor[]> {
    const response = await api.get('/supervisors/general-supervisors');
    return response.data;
  },

  // Get supervisors under a general supervisor
  async getSupervisorsUnder(generalSupervisorId: string): Promise<Supervisor[]> {
    const response = await api.get(`/supervisors/under/${generalSupervisorId}`);
    return response.data;
  },

  // Get supervisor statistics
  async getStats(): Promise<SupervisorStats> {
    const response = await api.get('/supervisors/stats');
    return response.data;
  },

  // Get available locations
  async getLocations(): Promise<Location[]> {
    const response = await api.get('/supervisors/locations');
    return response.data;
  },

  // Assign supervisor to general supervisor
  async assignToGeneralSupervisor(
    supervisorId: string,
    generalSupervisorId: string | null
  ): Promise<Supervisor> {
    const response = await api.patch(`/supervisors/${supervisorId}/assign`, {
      generalSupervisorId,
    });
    return response.data;
  },

  // Get pending supervisor approvals (Director and Manager)
  async getPendingApprovals(): Promise<Supervisor[]> {
    const response = await api.get('/supervisors/pending-approvals');
    console.log('Raw pending approvals response:', response.data);
    
    // Handle both array and non-array responses
    const data = Array.isArray(response.data) ? response.data : [];
    
    // Transform backend response (_id, userId) to frontend format (id, users)
    const transformed = data.map((supervisor: any) => {
      try {
        const result = {
          ...supervisor,
          id: supervisor._id || supervisor.id,
          users: supervisor.userId || supervisor.users,
          generalSupervisor: supervisor.generalSupervisorId ? {
            id: supervisor.generalSupervisorId._id || supervisor.generalSupervisorId.id,
            users: supervisor.generalSupervisorId.userId || supervisor.generalSupervisorId.users,
          } : undefined,
        };
        console.log('Transformed supervisor:', {
          original_id: supervisor._id,
          transformed_id: result.id,
          fullName: result.fullName,
        });
        return result;
      } catch (err) {
        console.error('Error transforming supervisor:', err, supervisor);
        return supervisor;
      }
    });
    
    console.log('All transformed supervisors:', transformed.map(s => ({ id: s.id, fullName: s.fullName })));
    return transformed;
  },

  // Get approval statistics (Director and Manager)
  async getApprovalStats(): Promise<ApprovalStats> {
    const response = await api.get('/supervisors/approval-stats');
    return response.data;
  },

  // Approve supervisor (Director and Manager)
  async approve(supervisorId: string): Promise<{
    message: string;
    supervisor: Supervisor;
    credentials?: SupervisorCredentials;
  }> {
    const response = await api.post(`/supervisors/${supervisorId}/approve`);
    return response.data;
  },

  // Reject supervisor (Director only)
  async reject(supervisorId: string, reason: string): Promise<{
    message: string;
    supervisor: Supervisor;
  }> {
    const response = await api.post(`/supervisors/${supervisorId}/reject`, { reason });
    return response.data;
  },
};
