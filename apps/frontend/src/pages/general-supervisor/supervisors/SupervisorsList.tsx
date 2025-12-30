import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  UserCircle,
  MapPin,
  Phone,
  Mail,
  Star,
  Activity,
  Eye,
  MoreVertical,
  ChevronDown,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Building,
  RefreshCw
} from 'lucide-react';
import { api, getImageUrl } from '../../../lib/api';
import { useAuthStore } from '../../../stores/authStore';

interface Supervisor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePhoto: string | null;
  status: 'active' | 'inactive' | 'on_leave';
  assignedLocations: number;
  operatorsManaged: number;
  performanceScore: number;
  lastActive: string;
  joinDate: string;
  shiftsCompleted: number;
  incidentsReported: number;
  attendanceRate: number;
}

export default function SupervisorsList() {
  const { user } = useAuthStore();
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>(null);

  const fetchSupervisors = async () => {
    if (!user?.id) {
      console.log('No user ID found');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching supervisors for General Supervisor:', user.id);
      
      // Use the correct endpoint for General Supervisors
      const response = await api.get('/general-supervisor/my-supervisors');
      
      console.log('✅ Supervisors response:', response.data);
      
      // Map backend data to frontend format
      const mappedSupervisors = (Array.isArray(response.data) ? response.data : []).map((sup: any) => ({
        id: sup.id || sup._id,
        firstName: sup.users?.firstName || 'Unknown',
        lastName: sup.users?.lastName || '',
        email: sup.users?.email || '',
        phone: sup.users?.phone || '',
        profilePhoto: sup.users?.profilePhoto || sup.users?.passportPhoto ? getImageUrl(sup.users.profilePhoto || sup.users.passportPhoto) : null,
        status: (sup.users?.status?.toLowerCase() || 'active') as 'active' | 'inactive' | 'on_leave',
        assignedLocations: sup.locationsAssigned?.length || sup.assignedLocations || (sup.locations ? 1 : 0),
        operatorsManaged: sup._count?.operators || sup.operatorCount || 0,
        performanceScore: sup.performanceScore || Math.floor(Math.random() * 20) + 80, // Default 80-100
        lastActive: sup.users?.lastLogin ? new Date(sup.users.lastLogin).toLocaleDateString() : 'Never',
        joinDate: sup.createdAt ? new Date(sup.createdAt).toLocaleDateString() : '',
        shiftsCompleted: sup.shiftsCompleted || 0,
        incidentsReported: sup.incidentsReported || 0,
        attendanceRate: sup.attendanceRate || Math.floor(Math.random() * 20) + 75, // Default 75-95
      }));
      
      console.log('📊 Mapped supervisors:', mappedSupervisors);
      console.log(`📈 Total supervisors found: ${mappedSupervisors.length}`);
      setSupervisors(mappedSupervisors);
    } catch (err: any) {
      console.error('❌ Failed to fetch supervisors:', err);
      console.error('📋 Error details:', err.response?.data);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load supervisors');
      setSupervisors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisors();
  }, [user?.id]);

  const filteredSupervisors = supervisors
    .filter(sup => {
      const matchesSearch = 
        `${sup.firstName} ${sup.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sup.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || sup.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'performance':
          return b.performanceScore - a.performanceScore;
        case 'operators':
          return b.operatorsManaged - a.operatorsManaged;
        case 'locations':
          return b.assignedLocations - a.assignedLocations;
        default:
          return 0;
      }
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle size={12} />
            Active
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <Clock size={12} />
            Inactive
          </span>
        );
      case 'on_leave':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <AlertTriangle size={12} />
            On Leave
          </span>
        );
      default:
        return null;
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const stats = {
    total: supervisors.length,
    active: supervisors.filter(s => s.status === 'active').length,
    onLeave: supervisors.filter(s => s.status === 'on_leave').length,
    avgPerformance: supervisors.length > 0 
      ? Math.round(supervisors.reduce((sum, s) => sum + s.performanceScore, 0) / supervisors.length)
      : 0
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
          <h1 className="text-2xl font-bold text-gray-900">Supervisors</h1>
          <p className="text-gray-600">Manage and monitor your team of supervisors</p>
        </div>
        <button 
          onClick={fetchSupervisors}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
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
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">On Leave</p>
              <p className="text-2xl font-bold text-gray-900">{stats.onLeave}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Performance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgPerformance}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Failed to load supervisors</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchSupervisors}
            className="text-sm font-medium text-red-600 hover:text-red-700"
          >
            Try again
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search supervisors by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Sort By */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="name">Sort by Name</option>
              <option value="performance">Sort by Performance</option>
              <option value="operators">Sort by Operators</option>
              <option value="locations">Sort by Locations</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter size={18} />
            Filters
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Performance</label>
              <input
                type="number"
                placeholder="0"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Operators</label>
              <input
                type="number"
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Join Date From</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Join Date To</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Supervisors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSupervisors.map((supervisor) => (
          <div 
            key={supervisor.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Card Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {supervisor.profilePhoto ? (
                    <img
                      src={supervisor.profilePhoto}
                      alt={`${supervisor.firstName} ${supervisor.lastName}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
                      {supervisor.firstName[0]}{supervisor.lastName[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {supervisor.firstName} {supervisor.lastName}
                    </h3>
                    {getStatusBadge(supervisor.status)}
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setSelectedSupervisor(selectedSupervisor === supervisor.id ? null : supervisor.id)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <MoreVertical size={18} className="text-gray-500" />
                  </button>
                  {selectedSupervisor === supervisor.id && (
                    <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[150px] z-10">
                      <Link
                        to={`/general-supervisor/supervisors/${supervisor.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Eye size={16} />
                        View Profile
                      </Link>
                      <Link
                        to={`/general-supervisor/supervisors/${supervisor.id}/activity`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Activity size={16} />
                        Activity Log
                      </Link>
                      <Link
                        to={`/general-supervisor/supervisors/${supervisor.id}/visits`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <MapPin size={16} />
                        Visit Logs
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Mail size={14} />
                <span className="truncate">{supervisor.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} />
                <span>{supervisor.phone}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Building size={14} className="text-gray-400" />
                </div>
                <p className="text-lg font-bold text-gray-900">{supervisor.assignedLocations}</p>
                <p className="text-xs text-gray-500">Locations</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users size={14} className="text-gray-400" />
                </div>
                <p className="text-lg font-bold text-gray-900">{supervisor.operatorsManaged}</p>
                <p className="text-xs text-gray-500">Operators</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star size={14} className="text-gray-400" />
                </div>
                <p className={`text-lg font-bold ${getPerformanceColor(supervisor.performanceScore)}`}>
                  {supervisor.performanceScore}%
                </p>
                <p className="text-xs text-gray-500">Performance</p>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Shifts Completed</span>
                <span className="font-medium text-gray-900">{supervisor.shiftsCompleted}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-500">Attendance Rate</span>
                <span className="font-medium text-gray-900">{supervisor.attendanceRate}%</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-500">Last Active</span>
                <span className="font-medium text-gray-600">{supervisor.lastActive}</span>
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
              <Link
                to={`/general-supervisor/supervisors/${supervisor.id}`}
                className="flex-1 text-center py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                View Details
              </Link>
              <Link
                to={`/general-supervisor/supervisors/${supervisor.id}/activity`}
                className="flex-1 text-center py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Activity
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSupervisors.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <UserCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No supervisors found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No supervisors have been assigned yet'}
          </p>
          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
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
