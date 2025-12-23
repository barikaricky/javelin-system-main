import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  UserCircle,
  Building,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Users,
  Eye,
  MoreVertical,
  RefreshCw,
  Coffee,
  Shield
} from 'lucide-react';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';

interface Operator {
  _id: string;
  employeeId: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
    profilePhoto?: string;
    passportPhoto?: string;
  };
  supervisorId: {
    _id: string;
    userId: {
      firstName: string;
      lastName: string;
    };
  };
  locationId?: {
    _id: string;
    name: string;
    address: string;
    state: string;
  };
  salary: number;
  startDate: string;
  createdAt: string;
}

export default function OperatorsList() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [supervisorFilter, setSupervisorFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const fetchOperators = async () => {
    setLoading(true);
    try {
      // Fetch all active operators (approved and working)
      const response = await api.get('/general-supervisor/operators');
      const data = response.data.operators || [];
      console.log('📊 Fetched operators:', data);
      setOperators(data);
    } catch (error: any) {
      console.error('Error fetching operators:', error);
      toast.error(error.response?.data?.error || 'Failed to load operators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  // Get unique supervisors and locations for filters
  const supervisors = [...new Set(operators.map(op => 
    `${op.supervisorId?.userId?.firstName || ''} ${op.supervisorId?.userId?.lastName || ''}`.trim()
  ).filter(Boolean))];
  const locations = [...new Set(operators.map(op => op.locationId?.name).filter(Boolean) as string[])];

  const filteredOperators = operators.filter(op => {
    const fullName = `${op.userId?.firstName || ''} ${op.userId?.lastName || ''}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchQuery.toLowerCase()) ||
      (op.userId?.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || op.userId?.status === statusFilter;
    const supervisorName = `${op.supervisorId?.userId?.firstName || ''} ${op.supervisorId?.userId?.lastName || ''}`.trim();
    const matchesSupervisor = supervisorFilter === 'all' || supervisorName === supervisorFilter;
    const matchesLocation = locationFilter === 'all' || op.locationId?.name === locationFilter;
    return matchesSearch && matchesStatus && matchesSupervisor && matchesLocation;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle size={12} />
            Active
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock size={12} />
            Pending
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertTriangle size={12} />
            Suspended
          </span>
        );
      default:
        return null;
    }
  };

  const stats = {
    total: operators.length,
    active: operators.filter(o => o.userId?.status === 'ACTIVE').length,
    pending: operators.filter(o => o.userId?.status === 'PENDING').length,
    suspended: operators.filter(o => o.userId?.status === 'SUSPENDED').length
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
          <h1 className="text-2xl font-bold text-gray-900">Operators</h1>
          <p className="text-gray-600">View operators across all your supervised locations</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
          <button 
            onClick={fetchOperators}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Info Banner - View Only */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Shield size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-800 font-medium">View-Only Access</p>
          <p className="text-blue-600 text-sm">As a General Supervisor, you can view operators but cannot edit their details. Contact the Manager for any changes.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Operators</p>
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
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-gray-900">{stats.suspended}</p>
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
              placeholder="Search operators by name or email..."
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
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Supervisor Filter */}
          <div className="relative">
            <select
              value={supervisorFilter}
              onChange={(e) => setSupervisorFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Supervisors</option>
              {supervisors.map(sup => (
                <option key={sup} value={sup}>{sup}</option>
              ))}
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

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOperators.map((operator) => (
            <div 
              key={operator._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {operator.userId?.profilePhoto || operator.userId?.passportPhoto ? (
                      <img
                        src={operator.userId.profilePhoto || operator.userId.passportPhoto}
                        alt={`${operator.userId.firstName} ${operator.userId.lastName}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-lg">
                        {operator.userId?.firstName?.[0]}{operator.userId?.lastName?.[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {operator.userId?.firstName} {operator.userId?.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{operator.employeeId}</p>
                      {getStatusBadge(operator.userId?.status || 'PENDING')}
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setSelectedOperator(selectedOperator === operator._id ? null : operator._id)}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <MoreVertical size={18} className="text-gray-500" />
                    </button>
                    {selectedOperator === operator._id && (
                      <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[150px] z-10">
                        <Link
                          to={`/general-supervisor/operators/${operator._id}`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Eye size={16} />
                          View Profile
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Location & Supervisor */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Building size={14} />
                  <span className="truncate">{operator.locationId?.name || 'Not assigned'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UserCircle size={14} />
                  <span>Supervisor: {operator.supervisorId?.userId?.firstName} {operator.supervisorId?.userId?.lastName}</span>
                </div>
              </div>

              {/* Info & Stats */}
              <div className="p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Clock size={14} />
                  <span>Joined: {new Date(operator.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">₦{operator.salary?.toLocaleString() || '0'}</p>
                    <p className="text-xs text-gray-500">Salary</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-900 truncate">{operator.userId?.phone || 'N/A'}</p>
                    <p className="text-xs text-gray-500">Phone</p>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-4 py-3 border-t border-gray-100">
                <Link
                  to={`/general-supervisor/operators/${operator._id}`}
                  className="w-full text-center py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors block"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Operator</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Location</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Supervisor</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Salary</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOperators.map((operator) => (
                  <tr key={operator._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-medium text-sm">
                          {operator.userId?.firstName?.[0]}{operator.userId?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{operator.userId?.firstName} {operator.userId?.lastName}</p>
                          <p className="text-sm text-gray-500">{operator.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(operator.userId?.status || 'PENDING')}</td>
                    <td className="py-3 px-4 text-gray-600">{operator.locationId?.name || 'Not assigned'}</td>
                    <td className="py-3 px-4 text-gray-600">{operator.supervisorId?.userId?.firstName} {operator.supervisorId?.userId?.lastName}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm">₦{operator.salary?.toLocaleString() || '0'}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{operator.userId?.phone || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/general-supervisor/operators/${operator._id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredOperators.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <UserCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No operators found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'all' || supervisorFilter !== 'all' || locationFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No operators assigned to your locations yet'}
          </p>
          {(searchQuery || statusFilter !== 'all' || supervisorFilter !== 'all' || locationFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setSupervisorFilter('all');
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
