import { api } from '../lib/api';

// Director Dashboard Types
export interface DirectorDashboardStats {
  totalPersonnel: number;
  guardsOnDuty: number;
  activeManagers: number;
  generalSupervisors: number;
  supervisors: number;
  operators: number;
  secretaries: number;
  attendance: { present: number; absent: number; late: number };
  meetingsToday: number;
  activePolls: number;
  pendingApprovals: number;
  activeIncidents: number;
  totalLocations: number;
  understaffedLocations: number;
  monthlyExpenses: number;
  unreadMessages: number;
}

export interface LocationStatus {
  id: string;
  name: string;
  region: string;
  status: 'green' | 'yellow' | 'red';
  operators: number;
  required: number;
  supervisor: string;
}

export interface TopSupervisor {
  id: string;
  name: string;
  photo: string | null;
  rating: number;
  region: string;
  operatorsManaged: number;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  urgent: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: 'approval' | 'incident' | 'meeting' | 'expense';
}

// Manager Dashboard Types
export interface ManagerDashboardStats {
  totalSupervisors: number;
  totalGeneralSupervisors: number;
  totalOperators: number;
  activeLocations: number;
  todayAttendance: number;
  attendanceRate: number;
  openIncidents: number;
  pendingRequests: number;
  pendingApprovals: number;
}

export interface ManagerIncident {
  id: string;
  title: string;
  location: string;
  severity: 'low' | 'medium' | 'high';
  time: string;
  status: 'open' | 'investigating' | 'resolved';
}

export interface ManagerSupervisor {
  id: string;
  name: string;
  photo: string | null;
  location: string;
  operatorsCount: number;
  rating: number;
  status: 'active' | 'inactive';
  type: 'GENERAL_SUPERVISOR' | 'SUPERVISOR';
}

export interface ManagerLocation {
  id: string;
  name: string;
  address: string;
  operatorsAssigned: number;
  operatorsPresent: number;
  status: 'normal' | 'understaffed' | 'alert';
}

// General Supervisor Dashboard Types
export interface GSDashboardStats {
  supervisorsUnderMe: number;
  totalOperators: number;
  activeBits: number;
  todayAttendance: number;
  attendanceRate: number;
  openIncidents: number;
  pendingIssues: number;
  locationsUnderMe: number;
}

export interface GSSupervisor {
  id: string;
  name: string;
  photo?: string;
  locationsCount: number;
  operatorsCount: number;
  status: 'active' | 'on-leave' | 'offline';
  lastActivity: string;
  performance: number;
}

export interface GSIncident {
  id: string;
  title: string;
  location: string;
  reportedBy: string;
  severity: 'high' | 'medium' | 'low';
  time: string;
  status: 'open' | 'investigating' | 'resolved';
}

export interface GSLocationStatus {
  id: string;
  name: string;
  supervisor: string;
  operatorsAssigned: number;
  operatorsPresent: number;
  status: 'green' | 'yellow' | 'red';
}

// API Service Functions
export const dashboardService = {
  // Director Dashboard
  async getDirectorDashboard(): Promise<{
    stats: DirectorDashboardStats;
    locations: LocationStatus[];
    topSupervisors: TopSupervisor[];
    alerts: Alert[];
    notifications: Notification[];
  }> {
    try {
      const response = await api.get('/director/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching director dashboard:', error);
      // Return default empty values
      return {
        stats: {
          totalPersonnel: 0,
          guardsOnDuty: 0,
          activeManagers: 0,
          generalSupervisors: 0,
          supervisors: 0,
          operators: 0,
          secretaries: 0,
          attendance: { present: 0, absent: 0, late: 0 },
          meetingsToday: 0,
          activePolls: 0,
          pendingApprovals: 0,
          activeIncidents: 0,
          totalLocations: 0,
          understaffedLocations: 0,
          monthlyExpenses: 0,
          unreadMessages: 0,
        },
        locations: [],
        topSupervisors: [],
        alerts: [],
        notifications: [],
      };
    }
  },

  // Manager Dashboard
  async getManagerDashboard(): Promise<{
    stats: ManagerDashboardStats;
    incidents: ManagerIncident[];
    supervisors: ManagerSupervisor[];
    locations: ManagerLocation[];
  }> {
    try {
      const response = await api.get('/manager/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching manager dashboard:', error);
      // Return default empty values
      return {
        stats: {
          totalSupervisors: 0,
          totalGeneralSupervisors: 0,
          totalOperators: 0,
          activeLocations: 0,
          todayAttendance: 0,
          attendanceRate: 0,
          openIncidents: 0,
          pendingRequests: 0,
          pendingApprovals: 0,
        },
        incidents: [],
        supervisors: [],
        locations: [],
      };
    }
  },

  // General Supervisor Dashboard
  async getGSDashboard(): Promise<{
    stats: GSDashboardStats;
    supervisors: GSSupervisor[];
    incidents: GSIncident[];
    locations: GSLocationStatus[];
  }> {
    try {
      const response = await api.get('/general-supervisor/dashboard');
      // Map the response to our expected format
      const data = response.data;
      return {
        stats: data.stats || {
          supervisorsUnderMe: 0,
          totalOperators: 0,
          activeBits: 0,
          todayAttendance: 0,
          attendanceRate: 0,
          openIncidents: 0,
          pendingIssues: 0,
          locationsUnderMe: 0,
        },
        supervisors: data.supervisors || [],
        incidents: data.incidents || [],
        locations: data.locations || [],
      };
    } catch (error) {
      console.error('Error fetching GS dashboard:', error);
      // Return default empty values
      return {
        stats: {
          supervisorsUnderMe: 0,
          totalOperators: 0,
          activeBits: 0,
          todayAttendance: 0,
          attendanceRate: 0,
          openIncidents: 0,
          pendingIssues: 0,
          locationsUnderMe: 0,
        },
        supervisors: [],
        incidents: [],
        locations: [],
      };
    }
  },
};

export default dashboardService;
