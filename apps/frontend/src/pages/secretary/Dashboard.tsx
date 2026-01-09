import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Shield,
  FileText,
  MapPin,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  DollarSign,
  CreditCard,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface DashboardStats {
  locations: { total: number; active: number };
  beats: { total: number; active: number };
  documents: { total: number; pending: number };
  revenue: {
    thisMonth: number;
    thisYear: number;
    totalPaid: number;
    totalPending: number;
  };
  expenses: {
    thisMonth: number;
    lastMonth: number;
    totalApproved: number;
  };
}

export default function SecretaryDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [locationsRes, bitsRes, invoicesRes, expensesRes] = await Promise.all([
        api.get('/locations?page=1&limit=1'),
        api.get('/beats?page=1&limit=1'),
        api.get('/invoices/stats'),
        api.get('/expenses/stats'),
      ]);

      const invoiceStats = invoicesRes.data;
      const expenseStats = expensesRes.data;

      // Calculate this year's revenue
      const now = new Date();
      const thisYearStart = new Date(now.getFullYear(), 0, 1);
      const invoicesThisYearRes = await api.get(`/invoices?startDate=${thisYearStart.toISOString()}`);
      const thisYearInvoices = invoicesThisYearRes.data.invoices || [];
      const thisYearRevenue = thisYearInvoices
        .filter((inv: any) => inv.status === 'PAID')
        .reduce((sum: number, inv: any) => sum + (inv.paidAmount || 0), 0);

      // Calculate this month's revenue
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const invoicesThisMonthRes = await api.get(`/invoices?startDate=${thisMonthStart.toISOString()}`);
      const thisMonthInvoices = invoicesThisMonthRes.data.invoices || [];
      const thisMonthRevenue = thisMonthInvoices
        .filter((inv: any) => inv.status === 'PAID')
        .reduce((sum: number, inv: any) => sum + (inv.paidAmount || 0), 0);

      setStats({
        locations: {
          total: locationsRes.data.pagination?.total || 0,
          active: locationsRes.data.pagination?.total || 0,
        },
        beats: {
          total: bitsRes.data.pagination?.total || 0,
          active: bitsRes.data.pagination?.total || 0,
        },
        documents: { total: 0, pending: 0 },
        revenue: {
          thisMonth: thisMonthRevenue,
          thisYear: thisYearRevenue,
          totalPaid: invoiceStats.amounts?.paid || 0,
          totalPending: invoiceStats.amounts?.pending || 0,
        },
        expenses: {
          thisMonth: expenseStats.thisMonth?.amount || 0,
          lastMonth: expenseStats.lastMonth?.amount || 0,
          totalApproved: expenseStats.approved?.amount || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load some dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Create Location',
      description: 'Register a new location',
      icon: MapPin,
      color: 'bg-blue-500',
      path: '/secretary/locations/create',
    },
    {
      title: 'Create Beat/Post',
      description: 'Add a security post',
      icon: Shield,
      color: 'bg-purple-500',
      path: '/secretary/beats/create',
    },
    {
      title: 'Upload Document',
      description: 'Add documents',
      icon: FileText,
      color: 'bg-green-500',
      path: '/secretary/documents/upload',
    },
    {
      title: 'View Locations',
      description: 'Manage locations',
      icon: Building2,
      color: 'bg-orange-500',
      path: '/secretary/locations',
    },
  ];

  const StatCard = ({ label, value, icon: Icon, color, subtext, isCurrency }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-3xl font-bold text-gray-900">
          {isCurrency ? `₦${value.toLocaleString()}` : value}
        </span>
      </div>
      <h3 className="text-sm font-medium text-gray-600">{label}</h3>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Secretary Dashboard
        </h1>
        <p className="text-gray-600 text-lg">
          Welcome back, <span className="text-purple-600 font-semibold">{user?.firstName}!</span>
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-12 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            label="Revenue This Month"
            value={stats?.revenue.thisMonth || 0}
            icon={DollarSign}
            color="bg-green-500"
            isCurrency={true}
            subtext="Current month earnings"
          />
          <StatCard
            label="Revenue This Year"
            value={stats?.revenue.thisYear || 0}
            icon={TrendingUp}
            color="bg-emerald-500"
            isCurrency={true}
            subtext="Year-to-date revenue"
          />
          <StatCard
            label="Expenses This Month"
            value={stats?.expenses.thisMonth || 0}
            icon={CreditCard}
            color="bg-red-500"
            isCurrency={true}
            subtext={`Last month: ₦${(stats?.expenses.lastMonth || 0).toLocaleString()}`}
          />
          <StatCard
            label="Total Locations"
            value={stats?.locations.total || 0}
            icon={Building2}
            color="bg-blue-500"
            subtext={`${stats?.locations.active || 0} active`}
          />
          <StatCard
            label="Total Beats/Posts"
            value={stats?.beats.total || 0}
            icon={Shield}
            color="bg-purple-500"
            subtext={`${stats?.beats.active || 0} active`}
          />
          <StatCard
            label="Pending Revenue"
            value={stats?.revenue.totalPending || 0}
            icon={Clock}
            color="bg-orange-500"
            isCurrency={true}
            subtext="Unpaid invoices"
          />
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className={`${action.color} hover:opacity-90 text-white rounded-xl p-6 text-left transition-all hover:scale-105`}
            >
              <action.icon className="w-8 h-8 mb-3" />
              <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
              <p className="text-sm text-white/90">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Responsibilities</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900">Location Management</h3>
              <p className="text-sm text-gray-600">Register and maintain operational locations</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
            <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900">Beat/Post Creation</h3>
              <p className="text-sm text-gray-600">Create and assign security posts</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
            <FileText className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900">Document Management</h3>
              <p className="text-sm text-gray-600">Upload and organize company documents</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
  