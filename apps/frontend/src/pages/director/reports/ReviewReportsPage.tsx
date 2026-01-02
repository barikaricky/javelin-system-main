import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  RefreshCw,
  ChevronDown,
  FileText,
  Calendar,
  Shield,
  Activity,
  Users,
  Package,
  ClipboardList,
  FileWarning,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { toast } from 'react-hot-toast';

// Report Types
const REPORT_TYPE_NAMES: Record<string, string> = {
  DAILY_ACTIVITY: 'Daily Activity Report',
  INCIDENT: 'Incident Report',
  EMERGENCY: 'Emergency Report',
  VISITOR_LOG: 'Visitor Log Report',
  PATROL: 'Patrol Report',
  EQUIPMENT: 'Equipment / Asset Report',
  CLIENT_INSTRUCTION: 'Client Instruction Report',
  END_OF_SHIFT: 'End-of-Shift Report',
};

const REPORT_TYPE_ICONS: Record<string, any> = {
  DAILY_ACTIVITY: Activity,
  INCIDENT: AlertTriangle,
  EMERGENCY: AlertCircle,
  VISITOR_LOG: Users,
  PATROL: Shield,
  EQUIPMENT: Package,
  CLIENT_INSTRUCTION: ClipboardList,
  END_OF_SHIFT: Clock,
};

const PRIORITY_CONFIG = {
  CRITICAL: { label: 'Critical', color: 'bg-red-100 text-red-800 border-red-300', icon: AlertCircle },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: AlertTriangle },
  MEDIUM: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
  LOW: { label: 'Low', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: FileText },
};

interface Report {
  _id: string;
  title: string;
  reportType: string;
  status: string;
  priority: keyof typeof PRIORITY_CONFIG;
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
      role: string;
    };
  };
  description: string;
  occurrenceDate: string;
  createdAt: string;
  submittedAt?: string;
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null;
  action: 'approve' | 'revision' | 'reject' | null;
  onSubmit: (comment: string) => void;
}

function ReviewModal({ isOpen, onClose, report, action, onSubmit }: ReviewModalProps) {
  const [comment, setComment] = useState('');
  
  if (!isOpen || !report || !action) return null;

  const modalConfig = {
    approve: {
      title: 'Approve Report',
      description: 'Are you sure you want to approve this report?',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      buttonText: 'Approve',
      commentRequired: false,
    },
    revision: {
      title: 'Request Revision',
      description: 'Please provide a reason for requesting revision:',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      buttonText: 'Request Revision',
      commentRequired: true,
    },
    reject: {
      title: 'Reject Report',
      description: 'Please provide a reason for rejecting this report:',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      buttonText: 'Reject',
      commentRequired: true,
    },
  };

  const config = modalConfig[action];

  const handleSubmit = () => {
    if (config.commentRequired && !comment.trim()) {
      toast.error('Comment is required');
      return;
    }
    onSubmit(comment);
    setComment('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">{config.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{report.title}</p>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-700 mb-4">{config.description}</p>
          
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={config.commentRequired ? 'Enter your reason (required)' : 'Add optional comment'}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
          />
        </div>

        <div className="p-6 bg-gray-50 rounded-b-xl flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${config.buttonColor}`}
          >
            {config.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedSubmitter, setSelectedSubmitter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'revision' | 'reject' | null>(null);

  // Get unique submitters
  const submitters = Array.from(
    new Set(reports.map(r => `${r.supervisorId?.userId?.firstName} ${r.supervisorId?.userId?.lastName}`))
  );

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, searchTerm, selectedType, selectedPriority, selectedSubmitter, dateFrom, dateTo, sortBy]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports', {
        params: { status: 'PENDING_REVIEW' }
      });
      
      if (response.data?.reports) {
        setReports(response.data.reports);
      }
    } catch (error: any) {
      console.error('Failed to fetch reports:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
    toast.success('Reports refreshed');
  };

  const applyFilters = () => {
    let filtered = [...reports];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(search) ||
        r.description.toLowerCase().includes(search) ||
        r.bitId?.bitName.toLowerCase().includes(search) ||
        r.locationId?.locationName.toLowerCase().includes(search)
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(r => r.reportType === selectedType);
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(r => r.priority === selectedPriority);
    }

    // Submitter filter
    if (selectedSubmitter !== 'all') {
      filtered = filtered.filter(r =>
        `${r.supervisorId?.userId?.firstName} ${r.supervisorId?.userId?.lastName}` === selectedSubmitter
      );
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(r => new Date(r.occurrenceDate) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(r => new Date(r.occurrenceDate) <= new Date(dateTo));
    }

    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'priority') {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }

    setFilteredReports(filtered);
  };

  const openReviewModal = (report: Report, action: 'approve' | 'revision' | 'reject') => {
    setSelectedReport(report);
    setReviewAction(action);
    setModalOpen(true);
  };

  const handleReviewSubmit = async (comment: string) => {
    if (!selectedReport || !reviewAction) return;

    try {
      const statusMap = {
        approve: 'APPROVED',
        revision: 'REVISION_REQUIRED',
        reject: 'REJECTED',
      };

      await api.put(`/reports/${selectedReport._id}/status`, {
        status: statusMap[reviewAction],
        reviewComment: comment,
      });

      toast.success(`Report ${reviewAction === 'approve' ? 'approved' : reviewAction === 'revision' ? 'revision requested' : 'rejected'} successfully`);
      
      setModalOpen(false);
      setSelectedReport(null);
      setReviewAction(null);
      
      // Refresh reports
      await fetchReports();
    } catch (error: any) {
      console.error('Failed to update report:', error);
      toast.error(error.response?.data?.message || 'Failed to update report');
    }
  };

  const getReportAge = (createdAt: string) => {
    const hours = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
    return hours;
  };

  const ReportTypeIcon = ({ type }: { type: string }) => {
    const Icon = REPORT_TYPE_ICONS[type] || FileText;
    return <Icon className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading pending reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Review Reports</h1>
              <p className="text-orange-100">Reports awaiting your review and approval</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{filteredReports.length}</div>
            <div className="text-sm text-orange-100">Pending Reviews</div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search reports..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {Object.entries(REPORT_TYPE_NAMES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* Submitter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Submitter</label>
              <select
                value={selectedSubmitter}
                onChange={(e) => setSelectedSubmitter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Submitters</option>
                {submitters.map((submitter) => (
                  <option key={submitter} value={submitter}>{submitter}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">Priority (Critical → Low)</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Pending Review</h3>
          <p className="text-gray-600">All reports have been reviewed. Great job!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const reportAge = getReportAge(report.createdAt);
            const isOld = reportAge >= 24;
            const PriorityIcon = PRIORITY_CONFIG[report.priority].icon;

            return (
              <div
                key={report._id}
                className={`bg-white rounded-xl shadow-sm border-2 hover:shadow-md transition-all ${
                  report.priority === 'CRITICAL' ? 'border-red-300' : 
                  report.priority === 'HIGH' ? 'border-orange-300' : 
                  'border-gray-200'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${
                        report.priority === 'CRITICAL' ? 'bg-red-100' :
                        report.priority === 'HIGH' ? 'bg-orange-100' :
                        'bg-gray-100'
                      }`}>
                        <ReportTypeIcon type={report.reportType} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${PRIORITY_CONFIG[report.priority].color}`}>
                            {PRIORITY_CONFIG[report.priority].label}
                          </span>
                          {isOld && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {reportAge}h old
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 mb-2">
                          {REPORT_TYPE_NAMES[report.reportType] || report.reportType}
                        </div>

                        <p className="text-gray-700 line-clamp-2 mb-3">
                          {report.description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span>
                              {report.supervisorId?.userId?.firstName} {report.supervisorId?.userId?.lastName}
                              <span className="text-xs ml-1">
                                ({report.supervisorId?.userId?.role === 'GENERAL_SUPERVISOR' ? 'GS' : 'Supervisor'})
                              </span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-600">
                            <Shield className="w-4 h-4" />
                            <span>{report.bitId?.bitName} ({report.bitId?.bitCode})</span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{report.locationId?.locationName}</span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(report.occurrenceDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => navigate(`/director/reports/${report._id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>

                    <button
                      onClick={() => openReviewModal(report, 'approve')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => openReviewModal(report, 'revision')}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Request Revision</span>
                    </button>

                    <button
                      onClick={() => openReviewModal(report, 'reject')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedReport(null);
          setReviewAction(null);
        }}
        report={selectedReport}
        action={reviewAction}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
}
