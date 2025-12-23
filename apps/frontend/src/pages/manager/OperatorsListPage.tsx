import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Eye,
  Shield,
  MapPin,
  Phone,
  Mail,
  ChevronDown,
  Building2,
  Clock,
  X,
  Home,
  DollarSign,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { getImageUrl } from '../../lib/api';
import { operatorService, Operator, OperatorStats } from '../../services/operatorService';

export default function OperatorsListPage() {
  const navigate = useNavigate();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [stats, setStats] = useState<OperatorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'INACTIVE'>('ALL');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const params = statusFilter !== 'ALL' ? { status: statusFilter } : {};
      const [operatorsData, statsData] = await Promise.all([
        operatorService.getAll(params),
        operatorService.getStats()
      ]);
      
      console.log('📊 Operators loaded:', operatorsData);
      setOperators(operatorsData || []);
      setStats(statsData || { total: 0, active: 0, inactive: 0, pending: 0 });
    } catch (error) {
      console.error('Error loading operators:', error);
      setOperators([]);
      setStats({ total: 0, active: 0, inactive: 0, pending: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOperators = operators.filter(op => {
    const searchLower = searchQuery.toLowerCase();
    return (
      op.fullName?.toLowerCase().includes(searchLower) ||
      op.employeeId?.toLowerCase().includes(searchLower) ||
      op.users?.email?.toLowerCase().includes(searchLower) ||
      (op.users?.phone && op.users.phone.includes(searchQuery))
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getApprovalStatusBadge = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return { class: 'bg-green-100 text-green-700 border border-green-200', label: 'Approved', icon: '✓' };
      case 'REJECTED':
        return { class: 'bg-red-100 text-red-700 border border-red-200', label: 'Rejected', icon: '✕' };
      case 'PENDING':
      default:
        return { class: 'bg-amber-100 text-amber-700 border border-amber-200', label: 'Pending Approval', icon: '⏳' };
    }
  };

  const handleViewDetails = (operator: Operator) => {
    setSelectedOperator(operator);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedOperator(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operators (Guards)</h1>
          <p className="text-gray-600 mt-1">Manage all security operators</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-amber-200 bg-amber-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{stats.pending || 0}</p>
                <p className="text-sm text-amber-600">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
                <p className="text-sm text-gray-500">Inactive</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50"
            >
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">
                {statusFilter === 'ALL' ? 'All Status' : statusFilter}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-10">
                {[
                  { value: 'ALL', label: 'All Status' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'INACTIVE', label: 'Inactive' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setStatusFilter(option.value as any);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl ${
                      statusFilter === option.value ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Operators List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading operators...</p>
          </div>
        ) : filteredOperators.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No operators found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-4 p-4">
              {filteredOperators.map((operator) => (
                <div key={operator.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {operator.users?.profilePhoto || operator.users?.passportPhoto ? (
                        <img
                          src={getImageUrl(operator.users.profilePhoto || operator.users.passportPhoto)}
                          alt={operator.fullName}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-emerald-600 font-semibold text-lg">
                          {operator.users?.firstName?.[0]}{operator.users?.lastName?.[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{operator.fullName}</h3>
                      <p className="text-sm text-gray-500">{operator.employeeId}</p>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium mt-2 ${getStatusBadge(operator.users?.status || 'PENDING')}`}>
                        {operator.users?.status || 'PENDING'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{operator.users?.email || 'N/A'}</span>
                    </div>
                    {operator.users?.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{operator.users.phone}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleViewDetails(operator)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Operator
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Contact
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Location
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Supervisor
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOperators.map((operator) => (
                    <tr key={operator.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {operator.users?.profilePhoto || operator.users?.passportPhoto ? (
                              <img
                                src={getImageUrl(operator.users.profilePhoto || operator.users.passportPhoto)}
                                alt={operator.fullName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-emerald-600 font-semibold">
                                {operator.users?.firstName?.[0]}{operator.users?.lastName?.[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{operator.fullName}</p>
                            <p className="text-xs text-gray-500">{operator.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="w-3.5 h-3.5" />
                            {operator.users?.email || 'N/A'}
                          </p>
                          {operator.users?.phone && (
                            <p className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="w-3.5 h-3.5" />
                              {operator.users.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {operator.locations ? (
                          <div className="space-y-1">
                            <p className="flex items-center gap-1 text-sm text-gray-600">
                              <Building2 className="w-3.5 h-3.5" />
                              {operator.locations.name}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {operator.supervisor ? (
                          <p className="text-sm text-gray-600">
                            {operator.supervisor.users.firstName} {operator.supervisor.users.lastName}
                          </p>
                        ) : (
                          <span className="text-sm text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(operator.users?.status || 'PENDING')}`}>
                          {operator.users?.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewDetails(operator)}
                          className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Operator Detail Modal */}
      {showDetailModal && selectedOperator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={closeDetailModal}>
          <div 
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold">Operator Details</h2>
                <button
                  onClick={closeDetailModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30">
                  {selectedOperator.users?.profilePhoto || selectedOperator.users?.passportPhoto ? (
                    <img
                      src={getImageUrl(selectedOperator.users.profilePhoto || selectedOperator.users.passportPhoto)}
                      alt={selectedOperator.fullName}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold">
                      {selectedOperator.users?.firstName?.[0]}{selectedOperator.users?.lastName?.[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{selectedOperator.fullName}</h3>
                  <p className="text-white/80 text-sm">{selectedOperator.employeeId}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {(() => {
                      const approvalBadge = getApprovalStatusBadge(selectedOperator.approvalStatus);
                      return (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${approvalBadge.class}`}>
                          <span>{approvalBadge.icon}</span>
                          {approvalBadge.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-emerald-600" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="font-medium text-gray-900">{selectedOperator.users?.email || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <p className="font-medium text-gray-900">{selectedOperator.users?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              {(selectedOperator.users?.state || selectedOperator.users?.lga || selectedOperator.users?.address) && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    Location Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedOperator.users?.state && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">State</p>
                        <p className="font-medium text-gray-900">{selectedOperator.users.state}</p>
                      </div>
                    )}
                    {selectedOperator.users?.lga && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">LGA</p>
                        <p className="font-medium text-gray-900">{selectedOperator.users.lga}</p>
                      </div>
                    )}
                    {selectedOperator.users?.address && (
                      <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Address</p>
                        <p className="font-medium text-gray-900">{selectedOperator.users.address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Work Assignment */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  Work Assignment
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedOperator.locations ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Assigned Location</p>
                      <p className="font-medium text-gray-900">{selectedOperator.locations.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{selectedOperator.locations.address}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Assigned Location</p>
                      <p className="font-medium text-gray-400">Not assigned yet</p>
                    </div>
                  )}
                  {selectedOperator.supervisor ? (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs text-blue-600 mb-1">Supervisor</p>
                      <p className="font-medium text-gray-900">
                        {selectedOperator.supervisor.users.firstName} {selectedOperator.supervisor.users.lastName}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Supervisor</p>
                      <p className="font-medium text-gray-400">Not assigned</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Salary Information */}
              {selectedOperator.salary && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    Salary Information
                  </h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-xs text-green-600 mb-1">Monthly Salary</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₦{selectedOperator.salary.toLocaleString()}
                    </p>
                    {selectedOperator.salaryCategory && (
                      <p className="text-sm text-gray-600 mt-1">{selectedOperator.salaryCategory}</p>
                    )}
                    {selectedOperator.allowance && selectedOperator.allowance > 0 && (
                      <p className="text-xs text-green-600 mt-2">
                        + ₦{selectedOperator.allowance.toLocaleString()} allowance
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Account Status</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedOperator.users?.status || 'PENDING')}`}>
                    {selectedOperator.users?.status || 'PENDING'}
                  </span>
                </div>
                {selectedOperator.users?.createdAt && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Joined</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedOperator.users.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Rejection Reason */}
              {selectedOperator.approvalStatus === 'REJECTED' && selectedOperator.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-700 mb-2">Rejection Reason</h4>
                  <p className="text-sm text-red-600">{selectedOperator.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-2xl border-t">
              <button
                onClick={closeDetailModal}
                className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
