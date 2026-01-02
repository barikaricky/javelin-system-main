import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Users,
  MapPin,
  Shield,
  Download,
  Filter,
  Activity,
  Target,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { api } from '../../../lib/api';
import { toast } from 'react-hot-toast';

interface AnalyticsData {
  totalReports: number;
  byStatus: { [key: string]: number };
  byType: { [key: string]: number };
  byPriority: { [key: string]: number };
  byLocation: Array<{ name: string; count: number }>;
  byBIT: Array<{ name: string; count: number }>;
  bySupervisor: Array<{ name: string; count: number }>;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
  avgResponseTime: number;
  approvalRate: number;
  trends: {
    reportsThisMonth: number;
    reportsLastMonth: number;
    percentageChange: number;
  };
}

const STATUS_COLORS: { [key: string]: string } = {
  DRAFT: '#6B7280',
  PENDING_REVIEW: '#F59E0B',
  APPROVED: '#10B981',
  REVISION_REQUIRED: '#F97316',
  REJECTED: '#EF4444',
};

const PRIORITY_COLORS: { [key: string]: string } = {
  LOW: '#3B82F6',
  MEDIUM: '#F59E0B',
  HIGH: '#F97316',
  CRITICAL: '#EF4444',
};

const CHART_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#F97316', '#EF4444'];

export default function ReportsAnalyticsPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locations, setLocations] = useState<Array<{ _id: string; locationName: string }>>([]);

  useEffect(() => {
    fetchAnalytics();
    fetchLocations();
  }, [dateRange, selectedLocation]);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations');
      setLocations(response.data.locations || []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params: any = { days: dateRange };
      if (selectedLocation) params.locationId = selectedLocation;

      const response = await api.get('/reports/analytics', { params });
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = async () => {
    try {
      toast.loading('Exporting analytics...');
      const response = await api.get('/reports/analytics/export', {
        responseType: 'blob',
        params: { days: dateRange, locationId: selectedLocation },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reports-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.dismiss();
      toast.success('Analytics exported successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export analytics');
    }
  };

  // Format response time for display
  const formatResponseTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} mins`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)} hrs`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return `${days}d ${remainingHours}h`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const TrendIcon = analytics.trends.percentageChange >= 0 ? TrendingUp : TrendingDown;
  const trendColor = analytics.trends.percentageChange >= 0 ? 'text-green-600' : 'text-red-600';

  // Prepare data for charts
  const statusData = Object.entries(analytics.byStatus).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value,
    color: STATUS_COLORS[name] || '#6B7280',
  }));

  const priorityData = Object.entries(analytics.byPriority).map(([name, value]) => ({
    name,
    value,
    color: PRIORITY_COLORS[name] || '#6B7280',
  }));

  const typeData = Object.entries(analytics.byType).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    count: value,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <BarChart3 className="w-10 h-10 text-blue-600" />
                Reports Analytics
              </h1>
              <p className="text-gray-600">Comprehensive insights and statistics</p>
            </div>
            <button
              onClick={exportAnalytics}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Download className="w-5 h-5" />
              Export Report
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Filters:</span>
            </div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium transition-all"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium transition-all"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  {loc.locationName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Reports */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-10 h-10 opacity-80" />
              <span className="text-4xl font-bold">{analytics.totalReports}</span>
            </div>
            <p className="text-blue-100 font-medium mb-2">Total Reports</p>
            <div className={`flex items-center gap-1 ${trendColor} bg-white/20 rounded-lg px-2 py-1 w-fit`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-semibold text-white">
                {Math.abs(analytics.trends.percentageChange).toFixed(1)}% vs last period
              </span>
            </div>
          </div>

          {/* Pending Review */}
          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl shadow-xl p-6 text-white transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-10 h-10 opacity-80" />
              <span className="text-4xl font-bold">{analytics.byStatus.PENDING_REVIEW || 0}</span>
            </div>
            <p className="text-yellow-100 font-medium mb-2">Pending Review</p>
            <div className="text-sm text-yellow-100">
              Requires attention
            </div>
          </div>

          {/* Avg Response Time */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-10 h-10 opacity-80" />
              <span className="text-4xl font-bold">{formatResponseTime(analytics.avgResponseTime)}</span>
            </div>
            <p className="text-purple-100 font-medium mb-2">Avg Response Time</p>
            <div className="text-sm text-purple-100">
              From submission to approval
            </div>
          </div>

          {/* Approval Rate */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-10 h-10 opacity-80" />
              <span className="text-4xl font-bold">{analytics.approvalRate.toFixed(1)}%</span>
            </div>
            <p className="text-green-100 font-medium mb-2">Approval Rate</p>
            <div className="text-sm text-green-100">
              {analytics.byStatus.APPROVED || 0} approved / {(analytics.byStatus.APPROVED || 0) + (analytics.byStatus.REJECTED || 0)} processed
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status Distribution Pie Chart */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600" />
              Reports by Status
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Priority Distribution */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              Reports by Priority
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Report Types Bar Chart */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Reports by Type
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={typeData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#666" 
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]}>
                {typeData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity Trend */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-green-600" />
            Activity Trend (Last {dateRange} Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.recentActivity}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#666"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#3B82F6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Grid - Locations, BITs, Supervisors */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Locations */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              Top Locations
            </h3>
            <div className="space-y-3">
              {analytics.byLocation.slice(0, 5).map((location, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 truncate flex-1">
                    {location.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-red-500 to-pink-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(location.count / analytics.byLocation[0].count) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8 text-right">
                      {location.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top BITs */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Top BITs
            </h3>
            <div className="space-y-3">
              {analytics.byBIT.slice(0, 5).map((bit, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 truncate flex-1">
                    {bit.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(bit.count / analytics.byBIT[0].count) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8 text-right">
                      {bit.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Supervisors */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Top Supervisors
            </h3>
            <div className="space-y-3">
              {analytics.bySupervisor.slice(0, 5).map((supervisor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 truncate flex-1">
                    {supervisor.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(supervisor.count / analytics.bySupervisor[0].count) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8 text-right">
                      {supervisor.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
