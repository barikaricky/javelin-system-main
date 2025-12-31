import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Shield,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getImageUrl } from '../../../lib/api';
import OperatorDetailModal from '../../../components/secretary/OperatorDetailModal';

interface Operator {
  _id: string;
  employeeId: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    profilePhoto?: string;
  };
  locationId?: {
    _id: string;
    locationName: string;
  };
  bitId?: {
    _id: string;
    bitName: string;
  };
  status: string;
  createdAt: string;
}

export default function OperatorsListPage() {
  const navigate = useNavigate();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      setLoading(true);
      // Secretary can view operators, similar to manager
      const response = await api.get('/secretaries/operators');
      setOperators(response.data.operators || []);
    } catch (error: any) {
      console.error('Failed to fetch operators:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch operators');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
      ACTIVE: {
        label: 'Active',
        className: 'bg-green-100 text-green-700 border-green-200',
        icon: CheckCircle,
      },
      PENDING: {
        label: 'Pending Approval',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: Clock,
      },
      APPROVED: {
        label: 'Approved',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: CheckCircle,
      },
      REJECTED: {
        label: 'Rejected',
        className: 'bg-red-100 text-red-700 border-red-200',
        icon: XCircle,
      },
      INACTIVE: {
        label: 'Inactive',
        className: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: AlertTriangle,
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  const filteredOperators = operators.filter((operator) => {
    const matchesSearch =
      searchQuery === '' ||
      operator.userId.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      operator.userId.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      operator.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      operator.userId.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || operator.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = () => {
    return {
      all: operators.length,
      ACTIVE: operators.filter((o) => o.status === 'ACTIVE').length,
      PENDING: operators.filter((o) => o.status === 'PENDING').length,
      APPROVED: operators.filter((o) => o.status === 'APPROVED').length,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading operators...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-8 h-8 text-purple-600" />
                Security Operators
              </h1>
              <p className="text-gray-600 mt-1">View and manage registered operators</p>
            </div>
            <button
              onClick={() => navigate('/secretary/operators/register')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              <UserPlus className="w-5 h-5" />
              <span className="hidden sm:inline">Register Operator</span>
              <span className="sm:hidden">Register</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div
              onClick={() => setStatusFilter('all')}
              className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all ${
                statusFilter === 'all'
                  ? 'border-purple-500 ring-2 ring-purple-200'
                  : 'border-transparent hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{statusCounts.all}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div
              onClick={() => setStatusFilter('ACTIVE')}
              className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all ${
                statusFilter === 'ACTIVE'
                  ? 'border-green-500 ring-2 ring-green-200'
                  : 'border-transparent hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Active</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{statusCounts.ACTIVE}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div
              onClick={() => setStatusFilter('PENDING')}
              className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all ${
                statusFilter === 'PENDING'
                  ? 'border-yellow-500 ring-2 ring-yellow-200'
                  : 'border-transparent hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">{statusCounts.PENDING}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div
              onClick={() => setStatusFilter('APPROVED')}
              className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all ${
                statusFilter === 'APPROVED'
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-transparent hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Approved</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{statusCounts.APPROVED}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, employee ID, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Operators List */}
        {filteredOperators.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || statusFilter !== 'all' ? 'No operators found' : 'No operators registered yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Start by registering your first security operator'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button
                onClick={() => navigate('/secretary/operators/register')}
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                Register First Operator
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredOperators.map((operator) => (
              <div
                key={operator._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-5 border border-gray-100 cursor-pointer hover:border-purple-300"
                onClick={() => {
                  setSelectedOperator(operator);
                  setShowDetailModal(true);
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Profile Photo */}
                  <div className="flex-shrink-0">
                    {operator.userId.profilePhoto ? (
                      <img
                        src={getImageUrl(operator.userId.profilePhoto)}
                        alt={`${operator.userId.firstName} ${operator.userId.lastName}`}
                        className="w-16 h-16 rounded-full object-cover border-2 border-purple-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                        {operator.userId.firstName[0]}
                        {operator.userId.lastName[0]}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {operator.userId.firstName} {operator.userId.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">ID: {operator.employeeId}</p>
                      </div>
                      {getStatusBadge(operator.status)}
                    </div>

                    <div className="space-y-1.5 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{operator.userId.email}</span>
                      </div>
                      {operator.locationId && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="truncate">
                            {operator.locationId.locationName}
                            {operator.bitId && ` - ${operator.bitId.bitName}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Operator Detail Modal */}
      <OperatorDetailModal
        operator={selectedOperator}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedOperator(null);
        }}
      />
    </div>
  );
}
