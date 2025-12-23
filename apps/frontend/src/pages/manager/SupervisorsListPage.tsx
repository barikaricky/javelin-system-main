import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Shield,
  User,
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
} from 'lucide-react';
import { supervisorService, Supervisor, SupervisorStats } from '../../services/supervisorService';
import { getImageUrl } from '../../lib/api';

export default function SupervisorsListPage() {
  const navigate = useNavigate();
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [stats, setStats] = useState<SupervisorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'GENERAL_SUPERVISOR' | 'SUPERVISOR'>('ALL');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterType]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [supervisorsData, statsData] = await Promise.all([
        supervisorService.getAll(filterType !== 'ALL' ? { supervisorType: filterType } : undefined),
        supervisorService.getStats(),
      ]);
      console.log('📊 Supervisors loaded:', supervisorsData);
      console.log('👤 First supervisor full object:', JSON.stringify(supervisorsData[0], null, 2));
      if (supervisorsData[0]) {
        console.log('🔍 Checking userId field:', supervisorsData[0].userId);
        console.log('🔍 Checking users field:', supervisorsData[0].users);
        console.log('📸 All keys:', Object.keys(supervisorsData[0]));
      }
      setSupervisors(supervisorsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading supervisors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSupervisors = supervisors.filter(sup => {
    const searchLower = searchQuery.toLowerCase();
    return (
      sup.fullName.toLowerCase().includes(searchLower) ||
      sup.employeeId.toLowerCase().includes(searchLower) ||
      sup.users?.email?.toLowerCase().includes(searchLower) ||
      (sup.users?.phone && sup.users.phone.includes(searchQuery))
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
        return { class: 'bg-amber-100 text-amber-700 border border-amber-200 animate-pulse', label: 'Pending Approval', icon: '⏳' };
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'GENERAL_SUPERVISOR'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-blue-100 text-blue-700';
  };

  const handleViewDetails = (supervisor: Supervisor) => {
    setSelectedSupervisor(supervisor);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedSupervisor(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supervisors</h1>
          <p className="text-gray-600 mt-1">Manage General Supervisors and Supervisors</p>
        </div>
        <button
          onClick={() => navigate('/manager/supervisors/register')}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Register Supervisor
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.generalSupervisors}</p>
                <p className="text-sm text-gray-500">General</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.supervisors}</p>
                <p className="text-sm text-gray-500">Supervisors</p>
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
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-sm text-gray-500">Active</p>
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
                {filterType === 'ALL' ? 'All Types' : filterType === 'GENERAL_SUPERVISOR' ? 'General Supervisors' : 'Supervisors'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-10">
                {[
                  { value: 'ALL', label: 'All Types' },
                  { value: 'GENERAL_SUPERVISOR', label: 'General Supervisors' },
                  { value: 'SUPERVISOR', label: 'Supervisors' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilterType(option.value as any);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl ${
                      filterType === option.value ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'
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

      {/* Supervisors List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading supervisors...</p>
          </div>
        ) : filteredSupervisors.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No supervisors found</p>
            <button
              onClick={() => navigate('/manager/supervisors/register')}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Register your first supervisor
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-4 p-4">
              {filteredSupervisors.map((supervisor) => (
                <div key={supervisor.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {supervisor.users?.profilePhoto || supervisor.users?.passportPhoto ? (
                        <img
                          src={getImageUrl(supervisor.users.profilePhoto || supervisor.users.passportPhoto)}
                          alt={supervisor.fullName}
                          className="w-14 h-14 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = `<span class="text-emerald-600 font-semibold text-lg">${supervisor.users?.firstName?.[0] || ''}${supervisor.users?.lastName?.[0] || ''}</span>`;
                          }}
                        />
                      ) : (
                        <span className="text-emerald-600 font-semibold text-lg">
                          {supervisor.users?.firstName?.[0]}{supervisor.users?.lastName?.[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{supervisor.fullName}</h3>
                      <p className="text-sm text-gray-500">{supervisor.employeeId}</p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadge(supervisor.supervisorType)}`}>
                          {supervisor.supervisorType === 'GENERAL_SUPERVISOR' ? (
                            <>
                              <Shield className="w-3 h-3" />
                              General
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3" />
                              Supervisor
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{supervisor.users?.email || 'N/A'}</span>
                    </div>
                    {supervisor.users?.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{supervisor.users.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Assignment */}
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    {supervisor.supervisorType === 'GENERAL_SUPERVISOR' ? (
                      <div className="space-y-1">
                        {supervisor.regionAssigned && (
                          <p className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            {supervisor.regionAssigned}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          {supervisor.subordinateSupervisorCount || 0} supervisors
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {supervisor.locations && (
                          <p className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="w-4 h-4" />
                            {supervisor.locations.name}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          {supervisor.operatorCount || 0} guards
                        </p>
                        {supervisor.generalSupervisor && (
                          <p className="text-xs text-purple-600">
                            Reports to: {supervisor.generalSupervisor.users?.firstName} {supervisor.generalSupervisor.users?.lastName}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status & Approval */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {(() => {
                      const approvalBadge = getApprovalStatusBadge(supervisor.approvalStatus);
                      return (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${approvalBadge.class}`}>
                          <span>{approvalBadge.icon}</span>
                          {approvalBadge.label}
                        </span>
                      );
                    })()}
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(supervisor.users?.status || 'PENDING')}`}>
                      {supervisor.users?.status || 'PENDING'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetails(supervisor)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    <button
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                      title="More"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Supervisor
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Type
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Contact
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Assignment
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Approval
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
                  {filteredSupervisors.map((supervisor) => (
                    <tr key={supervisor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {supervisor.users?.profilePhoto || supervisor.users?.passportPhoto ? (
                              <img
                                src={getImageUrl(supervisor.users.profilePhoto || supervisor.users.passportPhoto)}
                                alt={supervisor.fullName}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.innerHTML = `<span class="text-emerald-600 font-semibold">${supervisor.users?.firstName?.[0] || ''}${supervisor.users?.lastName?.[0] || ''}</span>`;
                                }}
                              />
                            ) : (
                              <span className="text-emerald-600 font-semibold">
                                {supervisor.users?.firstName?.[0]}{supervisor.users?.lastName?.[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{supervisor.fullName}</p>
                            <p className="text-xs text-gray-500">{supervisor.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadge(supervisor.supervisorType)}`}>
                          {supervisor.supervisorType === 'GENERAL_SUPERVISOR' ? (
                            <>
                              <Shield className="w-3 h-3" />
                              General
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3" />
                              Supervisor
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="w-3.5 h-3.5" />
                            {supervisor.users?.email || 'N/A'}
                          </p>
                          {supervisor.users?.phone && (
                            <p className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="w-3.5 h-3.5" />
                              {supervisor.users.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {supervisor.supervisorType === 'GENERAL_SUPERVISOR' ? (
                          <div className="space-y-1">
                            {supervisor.regionAssigned && (
                              <p className="flex items-center gap-1 text-sm text-gray-600">
                                <MapPin className="w-3.5 h-3.5" />
                                {supervisor.regionAssigned}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              {supervisor.subordinateSupervisorCount || 0} supervisors
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {supervisor.locations && (
                              <p className="flex items-center gap-1 text-sm text-gray-600">
                                <Building2 className="w-3.5 h-3.5" />
                                {supervisor.locations.name}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              {supervisor.operatorCount || 0} guards
                            </p>
                            {supervisor.generalSupervisor && (
                              <p className="text-xs text-purple-600">
                                Reports to: {supervisor.generalSupervisor.users?.firstName} {supervisor.generalSupervisor.users?.lastName}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const approvalBadge = getApprovalStatusBadge(supervisor.approvalStatus);
                          return (
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${approvalBadge.class}`}>
                                <span>{approvalBadge.icon}</span>
                                {approvalBadge.label}
                              </span>
                              {supervisor.approvalStatus === 'PENDING' && (
                                <span className="text-xs text-amber-600">
                                  Awaiting Director
                                </span>
                              )}
                              {supervisor.approvalStatus === 'REJECTED' && supervisor.rejectionReason && (
                                <span className="text-xs text-red-600 truncate max-w-[120px]" title={supervisor.rejectionReason}>
                                  {supervisor.rejectionReason}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(supervisor.users?.status || 'PENDING')}`}>
                          {supervisor.users?.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                          onClick={() => handleViewDetails(supervisor)}
                            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="More"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Supervisor Detail Modal */}
      {showDetailModal && selectedSupervisor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={closeDetailModal}>
          <div 
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold">Supervisor Details</h2>
                <button
                  onClick={closeDetailModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30">
                  {selectedSupervisor.users?.profilePhoto || selectedSupervisor.users?.passportPhoto ? (
                    <img
                      src={getImageUrl(selectedSupervisor.users.profilePhoto || selectedSupervisor.users.passportPhoto)}
                      alt={selectedSupervisor.fullName}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold">
                      {selectedSupervisor.users?.firstName?.[0]}{selectedSupervisor.users?.lastName?.[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{selectedSupervisor.fullName}</h3>
                  <p className="text-white/80 text-sm">{selectedSupervisor.employeeId}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      selectedSupervisor.supervisorType === 'GENERAL_SUPERVISOR' 
                        ? 'bg-purple-100/20 text-white' 
                        : 'bg-blue-100/20 text-white'
                    }`}>
                      {selectedSupervisor.supervisorType === 'GENERAL_SUPERVISOR' ? (
                        <><Shield className="w-3 h-3" /> General Supervisor</>
                      ) : (
                        <><User className="w-3 h-3" /> Supervisor</>
                      )}
                    </span>
                    {(() => {
                      const approvalBadge = getApprovalStatusBadge(selectedSupervisor.approvalStatus);
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
                    <p className="font-medium text-gray-900">{selectedSupervisor.users?.email || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <p className="font-medium text-gray-900">{selectedSupervisor.users?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              {(selectedSupervisor.users?.state || selectedSupervisor.users?.lga || selectedSupervisor.users?.address) && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    Location Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSupervisor.users?.state && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">State</p>
                        <p className="font-medium text-gray-900">{selectedSupervisor.users.state}</p>
                      </div>
                    )}
                    {selectedSupervisor.users?.lga && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">LGA</p>
                        <p className="font-medium text-gray-900">{selectedSupervisor.users.lga}</p>
                      </div>
                    )}
                    {selectedSupervisor.users?.address && (
                      <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Address</p>
                        <p className="font-medium text-gray-900">{selectedSupervisor.users.address}</p>
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
                  {selectedSupervisor.supervisorType === 'GENERAL_SUPERVISOR' ? (
                    <>
                      {selectedSupervisor.regionAssigned && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs text-gray-500 mb-1">Region Assigned</p>
                          <p className="font-medium text-gray-900">{selectedSupervisor.regionAssigned}</p>
                        </div>
                      )}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">Subordinate Supervisors</p>
                        <p className="font-medium text-gray-900">{selectedSupervisor.subordinateSupervisorCount || 0}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      {selectedSupervisor.locations && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs text-gray-500 mb-1">Location</p>
                          <p className="font-medium text-gray-900">{selectedSupervisor.locations.name}</p>
                        </div>
                      )}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">Guards Assigned</p>
                        <p className="font-medium text-gray-900">{selectedSupervisor.operatorCount || 0}</p>
                      </div>
                      {selectedSupervisor.generalSupervisor && (
                        <div className="bg-purple-50 rounded-lg p-4 md:col-span-2">
                          <p className="text-xs text-purple-600 mb-1">Reports To</p>
                          <p className="font-medium text-gray-900">
                            {selectedSupervisor.generalSupervisor.users?.firstName} {selectedSupervisor.generalSupervisor.users?.lastName}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Salary Information */}
              {selectedSupervisor.salary && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    Salary Information
                  </h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-xs text-green-600 mb-1">Monthly Salary</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₦{selectedSupervisor.salary.toLocaleString()}
                    </p>
                    {selectedSupervisor.salaryCategory && (
                      <p className="text-sm text-gray-600 mt-1">{selectedSupervisor.salaryCategory}</p>
                    )}
                    {selectedSupervisor.allowance && selectedSupervisor.allowance > 0 && (
                      <p className="text-xs text-green-600 mt-2">
                        + ₦{selectedSupervisor.allowance.toLocaleString()} allowance
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Account Status</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedSupervisor.users?.status || 'PENDING')}`}>
                    {selectedSupervisor.users?.status || 'PENDING'}
                  </span>
                </div>
                {selectedSupervisor.users?.createdAt && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Joined</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedSupervisor.users.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Rejection Reason */}
              {selectedSupervisor.approvalStatus === 'REJECTED' && selectedSupervisor.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-700 mb-2">Rejection Reason</h4>
                  <p className="text-sm text-red-600">{selectedSupervisor.rejectionReason}</p>
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
