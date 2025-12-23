import { useState, useEffect } from 'react';
import {
  Search,
  Activity,
  Calendar,
  Clock,
  ChevronDown,
  RefreshCw,
  Download,
  User,
  MapPin,
  LogIn,
  LogOut,
  FileText,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  actionType: 'login' | 'logout' | 'check_in' | 'check_out' | 'incident' | 'report' | 'visit' | 'approval' | 'other';
  description: string;
  user: {
    id: string;
    name: string;
    type: 'supervisor' | 'operator';
  };
  location: string | null;
  timestamp: string;
  date: string;
  metadata: Record<string, any>;
}

// Mock data
const mockActivityLogs: ActivityLog[] = [
  {
    id: 'log-001',
    action: 'Check-in',
    actionType: 'check_in',
    description: 'Checked in at Downtown Office',
    user: { id: 'sup-001', name: 'John Smith', type: 'supervisor' },
    location: 'Downtown Office',
    timestamp: '08:00 AM',
    date: '2025-01-20',
    metadata: { shift: 'Morning' }
  },
  {
    id: 'log-002',
    action: 'Login',
    actionType: 'login',
    description: 'Logged into the system',
    user: { id: 'op-001', name: 'Alex Johnson', type: 'operator' },
    location: null,
    timestamp: '07:55 AM',
    date: '2025-01-20',
    metadata: { device: 'Mobile App' }
  },
  {
    id: 'log-003',
    action: 'Incident Report',
    actionType: 'incident',
    description: 'Filed incident report #IR-456 - Unauthorized Access Attempt',
    user: { id: 'sup-001', name: 'John Smith', type: 'supervisor' },
    location: 'Downtown Office',
    timestamp: '09:45 AM',
    date: '2025-01-20',
    metadata: { incidentId: 'IR-456' }
  },
  {
    id: 'log-004',
    action: 'Location Visit',
    actionType: 'visit',
    description: 'Completed patrol visit at North Mall',
    user: { id: 'sup-002', name: 'Sarah Johnson', type: 'supervisor' },
    location: 'North Mall',
    timestamp: '10:30 AM',
    date: '2025-01-20',
    metadata: { duration: '45 minutes' }
  },
  {
    id: 'log-005',
    action: 'Check-out',
    actionType: 'check_out',
    description: 'Checked out from Tech Park',
    user: { id: 'op-003', name: 'James Wilson', type: 'operator' },
    location: 'Tech Park',
    timestamp: '02:00 PM',
    date: '2025-01-20',
    metadata: { hoursWorked: '8h' }
  },
  {
    id: 'log-006',
    action: 'Report Submitted',
    actionType: 'report',
    description: 'Daily shift report submitted',
    user: { id: 'sup-003', name: 'Michael Williams', type: 'supervisor' },
    location: 'Tech Park',
    timestamp: '02:15 PM',
    date: '2025-01-20',
    metadata: { reportType: 'Daily Shift' }
  },
  {
    id: 'log-007',
    action: 'Logout',
    actionType: 'logout',
    description: 'Logged out from the system',
    user: { id: 'op-002', name: 'Maria Garcia', type: 'operator' },
    location: null,
    timestamp: '04:05 PM',
    date: '2025-01-20',
    metadata: { device: 'Desktop' }
  },
  {
    id: 'log-008',
    action: 'Check-in',
    actionType: 'check_in',
    description: 'Checked in at East Campus',
    user: { id: 'op-004', name: 'Lisa Anderson', type: 'operator' },
    location: 'East Campus',
    timestamp: '04:00 PM',
    date: '2025-01-20',
    metadata: { shift: 'Evening' }
  },
  {
    id: 'log-009',
    action: 'Approval',
    actionType: 'approval',
    description: 'Approved leave request for operator',
    user: { id: 'sup-002', name: 'Sarah Johnson', type: 'supervisor' },
    location: null,
    timestamp: '11:30 AM',
    date: '2025-01-20',
    metadata: { requestType: 'Leave' }
  },
  {
    id: 'log-010',
    action: 'Location Visit',
    actionType: 'visit',
    description: 'Routine inspection at South Terminal',
    user: { id: 'sup-004', name: 'Emily Brown', type: 'supervisor' },
    location: 'South Terminal',
    timestamp: '03:00 PM',
    date: '2025-01-20',
    metadata: { duration: '1 hour' }
  }
];

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setLogs(mockActivityLogs);
      setLoading(false);
    };
    fetchLogs();
  }, [selectedDate]);

  // Get unique locations
  const locations = [...new Set(logs.filter(l => l.location).map(l => l.location as string))];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActionType = actionTypeFilter === 'all' || log.actionType === actionTypeFilter;
    const matchesUserType = userTypeFilter === 'all' || log.user.type === userTypeFilter;
    const matchesLocation = locationFilter === 'all' || log.location === locationFilter;
    return matchesSearch && matchesActionType && matchesUserType && matchesLocation;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'login':
        return <LogIn size={16} className="text-green-600" />;
      case 'logout':
        return <LogOut size={16} className="text-gray-600" />;
      case 'check_in':
        return <CheckCircle size={16} className="text-blue-600" />;
      case 'check_out':
        return <Clock size={16} className="text-orange-600" />;
      case 'incident':
        return <AlertTriangle size={16} className="text-red-600" />;
      case 'report':
        return <FileText size={16} className="text-purple-600" />;
      case 'visit':
        return <MapPin size={16} className="text-indigo-600" />;
      case 'approval':
        return <CheckCircle size={16} className="text-emerald-600" />;
      default:
        return <Activity size={16} className="text-gray-600" />;
    }
  };

  const getActionBadgeColor = (actionType: string) => {
    switch (actionType) {
      case 'login':
        return 'bg-green-100 text-green-700';
      case 'logout':
        return 'bg-gray-100 text-gray-700';
      case 'check_in':
        return 'bg-blue-100 text-blue-700';
      case 'check_out':
        return 'bg-orange-100 text-orange-700';
      case 'incident':
        return 'bg-red-100 text-red-700';
      case 'report':
        return 'bg-purple-100 text-purple-700';
      case 'visit':
        return 'bg-indigo-100 text-indigo-700';
      case 'approval':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const current = new Date(selectedDate);
    if (direction === 'prev') {
      current.setDate(current.getDate() - 1);
    } else {
      current.setDate(current.getDate() + 1);
    }
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const stats = {
    total: logs.length,
    checkIns: logs.filter(l => l.actionType === 'check_in').length,
    incidents: logs.filter(l => l.actionType === 'incident').length,
    visits: logs.filter(l => l.actionType === 'visit').length
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600">Track all activities from supervisors and operators</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={18} />
            Export
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Date Navigator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => navigateDate('next')}
            disabled={selectedDate === new Date().toISOString().split('T')[0]}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Check-ins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.checkIns}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Incidents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.incidents}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <MapPin size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Location Visits</p>
              <p className="text-2xl font-bold text-gray-900">{stats.visits}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by action, description, or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Type Filter */}
          <div className="relative">
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="check_in">Check-in</option>
              <option value="check_out">Check-out</option>
              <option value="incident">Incident</option>
              <option value="report">Report</option>
              <option value="visit">Visit</option>
              <option value="approval">Approval</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* User Type Filter */}
          <div className="relative">
            <select
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Users</option>
              <option value="supervisor">Supervisors</option>
              <option value="operator">Operators</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Location Filter */}
          <div className="relative">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Activity Logs List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {paginatedLogs.map((log) => (
            <div 
              key={log.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                  {getActionIcon(log.actionType)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActionBadgeColor(log.actionType)}`}>
                      {log.action}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      log.user.type === 'supervisor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {log.user.type === 'supervisor' ? 'Supervisor' : 'Operator'}
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">{log.description}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{log.user.name}</span>
                    </div>
                    {log.location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>{log.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{log.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * logsPerPage + 1} to {Math.min(currentPage * logsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredLogs.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Activity size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No activity logs found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || actionTypeFilter !== 'all' || userTypeFilter !== 'all' || locationFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No activities recorded for this date'}
          </p>
          {(searchQuery || actionTypeFilter !== 'all' || userTypeFilter !== 'all' || locationFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setActionTypeFilter('all');
                setUserTypeFilter('all');
                setLocationFilter('all');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
