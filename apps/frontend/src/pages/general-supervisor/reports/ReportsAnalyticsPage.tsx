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
} from 'lucide-react';
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

const STATUS_COLORS = {
  DRAFT: '#6B7280',
  PENDING_REVIEW: '#F59E0B',
  APPROVED: '#10B981',
  REVISION_REQUIRED: '#F97316',
  REJECTED: '#EF4444',
};

const PRIORITY_COLORS = {
  LOW: '#3B82F6',
  MEDIUM: '#F59E0B',
  HIGH: '#F97316',
  CRITICAL: '#EF4444',
};

export default function ReportsAnalyticsPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Reports Analytics</h1>
              <p className="text-gray-600">Analytics for your assigned BITs</p>
            </div>
            <button
              onClick={exportAnalytics}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg"
            >
              <Download className="w-5 h-5" />
              Export Report
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{analytics.totalReports}</span>
            </div>
            <p className="text-blue-100 font-medium">Total Reports</p>
            <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium text-white">
                {Math.abs(analytics.trends.percentageChange).toFixed(1)}% vs last period
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{analytics.byStatus.PENDING_REVIEW || 0}</span>
            </div>
            <p className="text-yellow-100 font-medium">Pending Review</p>
            <p className="text-sm text-yellow-100 mt-2">Awaiting approval</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{analytics.approvalRate.toFixed(1)}%</span>
            </div>
            <p className="text-green-100 font-medium">Approval Rate</p>
            <p className="text-sm text-green-100 mt-2">
              {analytics.byStatus.APPROVED || 0} approved
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{analytics.avgResponseTime.toFixed(1)}</span>
            </div>
            <p className="text-purple-100 font-medium">Avg Response (hrs)</p>
            <p className="text-sm text-purple-100 mt-2">Review to approval</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Reports by Status */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Reports by Status
            </h3>
            <div className="space-y-3">
              {Object.entries(analytics.byStatus).map(([status, count]) => {
                const percentage = (count / analytics.totalReports) * 100;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reports by Priority */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              Reports by Priority
            </h3>
            <div className="space-y-3">
              {Object.entries(analytics.byPriority).map(([priority, count]) => {
                const percentage = (count / analytics.totalReports) * 100;
                return (
                  <div key={priority}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{priority}</span>
                      <span className="text-sm font-bold text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reports by Type */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-600" />
              Reports by Type
            </h3>
            <div className="space-y-2">
              {Object.entries(analytics.byType).map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {type.replace(/_/g, ' ')}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-green-600" />
              Activity Timeline
            </h3>
            <div className="space-y-2">
              {analytics.recentActivity.slice(0, 10).map((activity, index) => {
                const maxCount = Math.max(...analytics.recentActivity.map((a) => a.count));
                const percentage = (activity.count / maxCount) * 100;
                return (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-20">
                      {new Date(activity.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-green-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8 text-right">
                      {activity.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Locations */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Top Locations
            </h3>
            <div className="space-y-2">
              {analytics.byLocation.slice(0, 5).map((location, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 w-6">{index + 1}</span>
                    <span className="text-sm text-gray-700">{location.name}</span>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                    {location.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top BITs */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Top BITs
            </h3>
            <div className="space-y-2">
              {analytics.byBIT.slice(0, 5).map((bit, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 w-6">{index + 1}</span>
                    <span className="text-sm text-gray-700">{bit.name}</span>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                    {bit.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Supervisors */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Top Supervisors
            </h3>
            <div className="space-y-2">
              {analytics.bySupervisor.slice(0, 5).map((supervisor, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 w-6">{index + 1}</span>
                    <span className="text-sm text-gray-700">{supervisor.name}</span>
                  </div>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                    {supervisor.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
