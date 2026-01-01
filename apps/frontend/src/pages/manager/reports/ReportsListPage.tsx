import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  User,
  RefreshCw,
  ChevronDown,
  FileWarning,
  Shield,
  Activity,
  AlertTriangle,
  Users,
  Package,
  ClipboardList,
  BarChart3,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { toast } from 'react-hot-toast';

// Report Types
const REPORT_TYPES = [
  { value: 'DAILY_ACTIVITY', label: 'Daily Activity Report', icon: Activity, color: 'blue' },
  { value: 'INCIDENT', label: 'Incident Report', icon: AlertTriangle, color: 'red' },
  { value: 'EMERGENCY', label: 'Emergency Report', icon: AlertCircle, color: 'red' },
  { value: 'VISITOR_LOG', label: 'Visitor Log Report', icon: Users, color: 'green' },
  { value: 'PATROL', label: 'Patrol Report', icon: Shield, color: 'indigo' },
  { value: 'EQUIPMENT', label: 'Equipment / Asset Report', icon: Package, color: 'purple' },
  { value: 'CLIENT_INSTRUCTION', label: 'Client Instruction Report', icon: ClipboardList, color: 'yellow' },
  { value: 'END_OF_SHIFT', label: 'End-of-Shift Report', icon: Clock, color: 'gray' },
];

// Status configurations
const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileText },
  PENDING_REVIEW: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REVISION_REQUIRED: { label: 'Revision Required', color: 'bg-orange-100 text-orange-800', icon: XCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

interface Report {
  _id: string;
  title: string;
  reportType: string;
  status: keyof typeof STATUS_CONFIG;
  bitId: {
    _id: string;
    bitName: string;
    bitCode: string;
  };
  locationId: {
    _id: string;
    locationName: string;
    city: string;
  };
  supervisorId: {
    _id: string;
    userId: {
      firstName: string;
      lastName: string;
    };
  };
  occurrenceDate: string;
  createdAt: string;
  hasImages: boolean;
  hasAudio: boolean;
  hasFiles: boolean;
}

export default function ManagerReportsListPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    revisionRequired: 0,
  });

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
    calculateStats();
  }, [reports, searchTerm, selectedType, selectedStatus, dateFrom, dateTo]);

  const fetchReports = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('📊 Fetching reports...');
      const response = await api.get('/reports');
      console.log('✅ Reports fetched:', response.data);
      
      setReports(response.data.reports || []);

      if (isRefresh) {
        toast.success('Reports refreshed');
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch reports:', error);
      toast.error('Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.bitId?.bitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.locationId?.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${report.supervisorId?.userId.firstName} ${report.supervisorId?.userId.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(report => report.reportType === selectedType);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(report => report.status === selectedStatus);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(report => 
        new Date(report.occurrenceDate) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(report => 
        new Date(report.occurrenceDate) <= new Date(dateTo)
      );
    }

    setFilteredReports(filtered);
  };

  const calculateStats = () => {
    setStats({
      total: reports.length,
      draft: reports.filter(r => r.status === 'DRAFT').length,
      pending: reports.filter(r => r.status === 'PENDING_REVIEW').length,
      approved: reports.filter(r => r.status === 'APPROVED').length,
      revisionRequired: reports.filter(r => r.status === 'REVISION_REQUIRED').length,
    });
  };

  const exportReport = async (reportId: string, reportTitle: string) => {
    try {
      toast.loading('Generating PDF...');
      const response = await api.get(`/reports/${reportId}/export`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportTitle.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.dismiss();
      toast.success('Report exported successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export report');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedStatus('all');
    setDateFrom('');
    setDateTo('');
  };

  const getReportTypeConfig = (type: string) => {
    return REPORT_TYPES.find(t => t.value === type) || REPORT_TYPES[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                Security Reports
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and review operational security reports
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchReports(true)}
                disabled={refreshing}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                to="/manager/reports/analytics"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2 shadow-sm"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Link>
              <Link
                to="/manager/reports/create"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 shadow-lg font-medium"
              >
                <Plus className="w-5 h-5" />
                Create Report
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600">Total Reports</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
              <p className="text-xs text-gray-600">Drafts</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-xs text-gray-600">Pending</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              <p className="text-xs text-gray-600">Approved</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.revisionRequired}</p>
              <p className="text-xs text-gray-600">Needs Revision</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by title, BIT, location, or supervisor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2 justify-center"
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    {REPORT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all text-sm font-medium"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredReports.length}</span> of{' '}
          <span className="font-semibold text-gray-900">{reports.length}</span> reports
        </div>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
            <FileWarning className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedType !== 'all' || selectedStatus !== 'all' || dateFrom || dateTo
                ? 'Try adjusting your filters or search term'
                : 'No reports have been created yet'}
            </p>
            {reports.length === 0 ? (
              <Link
                to="/manager/reports/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
              >
                <Plus className="w-5 h-5" />
                Create First Report
              </Link>
            ) : (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report, index) => {
              const typeConfig = getReportTypeConfig(report.reportType);
              const statusConfig = STATUS_CONFIG[report.status];
              const TypeIcon = typeConfig.icon;
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={report._id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 bg-${typeConfig.color}-100 rounded-lg flex-shrink-0`}>
                          <TypeIcon className={`w-6 h-6 text-${typeConfig.color}-600`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-900 truncate">{report.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} flex items-center gap-1`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{typeConfig.label}</p>
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="font-medium text-gray-900">{report.locationId?.locationName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">BIT</p>
                          <p className="font-medium text-gray-900">{report.bitId?.bitName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Submitted By</p>
                          <p className="font-medium text-gray-900">
                            {report.supervisorId?.userId.firstName} {report.supervisorId?.userId.lastName}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Evidence Indicators */}
                    <div className="flex items-center gap-3 mb-4">
                      {report.hasImages && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                          📷 Images
                        </span>
                      )}
                      {report.hasAudio && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          🎤 Audio
                        </span>
                      )}
                      {report.hasFiles && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          📎 Files
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {formatDate(report.occurrenceDate)}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => exportReport(report._id, report.title)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Export PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/manager/reports/${report._id}`}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/manager/reports/${report._id}/edit`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Report"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        {/* Manager CANNOT delete reports - removed delete button */}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
