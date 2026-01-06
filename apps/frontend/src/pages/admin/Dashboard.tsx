import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  Eye,
  MapPin,
  Clock,
  AlertCircle,
  ChevronRight,
  Activity,
  Mail,
  FileText,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

interface DashboardStats {
  totalBits: number;
  totalLocations: number;
  activeBits: number;
  inactiveBits: number;
  totalOperators: number;
  totalSupervisors: number;
  totalGeneralSupervisors: number;
  unreadMessages: number;
  recentReports: number;
}

interface RecentActivity {
  id: string;
  type: 'login' | 'view' | 'message';
  description: string;
  timestamp: Date;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBits: 0,
    totalLocations: 0,
    activeBits: 0,
    inactiveBits: 0,
    totalOperators: 0,
    totalSupervisors: 0,
    totalGeneralSupervisors: 0,
    unreadMessages: 0,
    recentReports: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'login',
      description: 'Logged in to the system',
      timestamp: new Date(),
    },
  ]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      // Fetch dashboard statistics
      const response = await api.get('/admins/dashboard-stats');
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    color, 
    bgColor,
    description 
  }: { 
    icon: any; 
    label: string; 
    value: number | string; 
    color: string; 
    bgColor: string;
    description?: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-4`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-2">{description}</p>
          )}
        </div>
      </div>
    </div>
  );

  const QuickAccessCard = ({ 
    icon: Icon, 
    title, 
    description, 
    href,
    color,
    bgColor 
  }: { 
    icon: any; 
    title: string; 
    description: string; 
    href: string;
    color: string;
    bgColor: string;
  }) => (
    <a
      href={href}
      className="block bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>
    </a>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-blue-100">
              View-only access to system operations and records
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            <span className="font-medium">Active Session</span>
          </div>
        </div>
      </div>

      {/* Access Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-900 mb-1">Limited Access Notice</h3>
          <p className="text-sm text-amber-800">
            Your admin account has view-only access to system data. You cannot approve, delete, or modify financial records.
            All actions are logged for security purposes.
          </p>
        </div>
      </div>

      {/* Statistics Overview */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-blue-600" />
          System Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Building2}
            label="Total BITs"
            value={stats.totalBits}
            color="text-blue-600"
            bgColor="bg-blue-50"
            description="Business Integration Teams"
          />
          <StatCard
            icon={MapPin}
            label="Total Locations"
            value={stats.totalLocations}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
            description="Active operational sites"
          />
          <StatCard
            icon={Users}
            label="Total Operators"
            value={stats.totalOperators}
            color="text-amber-600"
            bgColor="bg-amber-50"
            description="Field security staff"
          />
          <StatCard
            icon={Shield}
            label="Supervisors"
            value={stats.totalSupervisors + stats.totalGeneralSupervisors}
            color="text-teal-600"
            bgColor="bg-teal-50"
            description={`${stats.totalGeneralSupervisors} GS, ${stats.totalSupervisors} Supervisors`}
          />
        </div>
      </div>

      {/* BIT Status */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">BIT Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Active BITs</h3>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <p className="text-4xl font-bold text-green-600">{stats.activeBits}</p>
            <p className="text-sm text-gray-600 mt-2">Currently operational</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Inactive BITs</h3>
              <div className="w-3 h-3 bg-gray-400 rounded-full" />
            </div>
            <p className="text-4xl font-bold text-gray-600">{stats.inactiveBits}</p>
            <p className="text-sm text-gray-600 mt-2">Not currently active</p>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickAccessCard
            icon={Building2}
            title="View BITs & Locations"
            description="Browse all BITs and their locations"
            href="/admin/bits"
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <QuickAccessCard
            icon={Users}
            title="View Operators"
            description="Access operator profiles (read-only)"
            href="/admin/operators"
            color="text-amber-600"
            bgColor="bg-amber-50"
          />
          <QuickAccessCard
            icon={Mail}
            title="Messages"
            description={`${stats.unreadMessages} unread messages`}
            href="/admin/messages"
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
          <QuickAccessCard
            icon={FileText}
            title="View Reports"
            description="Access approved reports"
            href="/admin/reports"
            color="text-emerald-600"
            bgColor="bg-emerald-50"
          />
          <QuickAccessCard
            icon={Shield}
            title="View Supervisors"
            description="See supervisor assignments"
            href="/admin/supervisors"
            color="text-teal-600"
            bgColor="bg-teal-50"
          />
          <QuickAccessCard
            icon={UserCheck}
            title="Profile & Security"
            description="Manage your account settings"
            href="/admin/profile"
            color="text-indigo-600"
            bgColor="bg-indigo-50"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-600" />
          Recent Activity
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Eye className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
