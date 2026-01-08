import { useState, useEffect } from 'react';
import {
  Shield,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  MapPin,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Search,
  Copy,
  Check,
  Phone,
  Calendar,
  Building2,
  Briefcase,
  CreditCard,
  BadgeCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supervisorService, Supervisor, ApprovalStats, SupervisorCredentials } from '../../services/supervisorService';
import { getImageUrl } from '../../lib/api';

export default function PendingApprovalsPage() {
  const [pendingSupervisors, setPendingSupervisors] = useState<Supervisor[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvedCredentials, setApprovedCredentials] = useState<{
    supervisorName: string;
    credentials: SupervisorCredentials;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [supervisors, approvalStats] = await Promise.all([
        supervisorService.getPendingApprovals(),
        supervisorService.getApprovalStats(),
      ]);
      setPendingSupervisors(supervisors);
      setStats(approvalStats);
    } catch (error: any) {
      console.error('Error loading pending approvals:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to load pending approvals';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (supervisor: Supervisor) => {
    setProcessingId(supervisor.id);
    try {
      console.log('Approving supervisor:', supervisor.id, supervisor.fullName);
      const result = await supervisorService.approve(supervisor.id);
      console.log('Approval result:', result);
      
      toast.success(`${supervisor.fullName} has been approved!`);
      
      if (result.credentials) {
        setApprovedCredentials({
          supervisorName: supervisor.fullName,
          credentials: result.credentials,
        });
      }
      
      loadData();
    } catch (error: any) {
      console.error('Error approving supervisor:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
        code: error.code,
      });
      
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || 'Failed to approve supervisor';
      
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessingId(rejectingId);
    try {
      await supervisorService.reject(rejectingId, rejectionReason);
      toast.success('Supervisor registration rejected');
      setShowRejectModal(false);
      setRejectingId(null);
      setRejectionReason('');
      loadData();
    } catch (error: any) {
      console.error('Error rejecting supervisor:', error);
      toast.error(error.response?.data?.error || 'Failed to reject supervisor');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (supervisorId: string) => {
    setRejectingId(supervisorId);
    setShowRejectModal(true);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredSupervisors = pendingSupervisors.filter((sup) => {
    const query = searchQuery.toLowerCase();
    return (
      sup.fullName.toLowerCase().includes(query) ||
      sup.employeeId.toLowerCase().includes(query) ||
      sup.users.email.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | string | undefined) => {
    if (!amount) return '₦0';
    return `₦${Number(amount).toLocaleString()}`;
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Review and approve General Supervisor registrations from Managers</p>
      </div>

      {/* Stats Cards - Mobile Scrollable */}
      {stats && (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible scrollbar-hide">
          <div className="flex-shrink-0 w-28 sm:w-auto bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-amber-700">{stats.pending}</p>
                <p className="text-xs text-amber-600">Pending</p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 w-28 sm:w-auto bg-purple-50 border border-purple-200 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-purple-700">{stats.pendingGeneral}</p>
                <p className="text-xs text-purple-600">General</p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 w-28 sm:w-auto bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-blue-700">{stats.pendingSupervisor}</p>
                <p className="text-xs text-blue-600">Supervisors</p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 w-28 sm:w-auto bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-green-700">{stats.approved}</p>
                <p className="text-xs text-green-600">Approved</p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 w-28 sm:w-auto bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-red-700">{stats.rejected}</p>
                <p className="text-xs text-red-600">Rejected</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Pending List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading pending approvals...</p>
          </div>
        ) : filteredSupervisors.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No pending approvals</p>
            <p className="text-gray-500 text-sm mt-1">All supervisor registrations have been reviewed</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredSupervisors.map((supervisor) => (
              <div key={supervisor.id} className="bg-white">
                {/* Summary Row - Mobile Optimized */}
                <div
                  className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition-colors active:bg-gray-100"
                  onClick={() => setExpandedId(expandedId === supervisor.id ? null : supervisor.id)}
                >
                  <div className="flex flex-col gap-3">
                    {/* Photo and Info Row */}
                    <div className="flex items-start gap-3">
                      {/* Photo */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {supervisor.users?.passportPhoto ? (
                          <img
                            src={getImageUrl(supervisor.users.passportPhoto)}
                            alt={supervisor.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg sm:text-xl font-bold text-gray-400">
                            {supervisor.users?.firstName?.[0]}{supervisor.users?.lastName?.[0]}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                            {supervisor.fullName}
                          </h3>
                          <span className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                            supervisor.supervisorType === 'GENERAL_SUPERVISOR'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {supervisor.supervisorType === 'GENERAL_SUPERVISOR' ? (
                              <>
                                <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                General
                              </>
                            ) : (
                              <>
                                <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                Supervisor
                              </>
                            )}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">
                          {supervisor.users?.email}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          ID: {supervisor.employeeId}
                        </p>
                        {supervisor.registeredBy && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            By: {supervisor.registeredBy.firstName} • {formatDate(supervisor.createdAt)}
                          </p>
                        )}
                      </div>

                      {/* Expand Button */}
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 flex-shrink-0">
                        {expandedId === supervisor.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Actions - Full Width on Mobile */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(supervisor);
                        }}
                        disabled={processingId === supervisor.id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 active:bg-green-800 disabled:opacity-50 transition-colors"
                      >
                        {processingId === supervisor.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openRejectModal(supervisor.id);
                        }}
                        disabled={processingId === supervisor.id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-100 text-red-700 text-sm font-medium rounded-xl hover:bg-red-200 active:bg-red-300 disabled:opacity-50 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details - Full Supervisor Information */}
                {expandedId === supervisor.id && (
                  <div className="px-3 sm:px-4 pb-4 border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                    {/* Mobile: Single Column, Desktop: Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-4">
                      
                      {/* Personal Information */}
                      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                          </div>
                          Personal Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-gray-500 text-xs">Full Name</span>
                            <span className="text-gray-900 text-right font-medium text-xs sm:text-sm">{supervisor.fullName}</span>
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-gray-500 text-xs flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              Email
                            </span>
                            <span className="text-gray-900 text-right text-xs sm:text-sm truncate max-w-[140px] sm:max-w-[180px]">{supervisor.users?.email}</span>
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-gray-500 text-xs flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              Phone
                            </span>
                            <span className="text-gray-900 text-xs sm:text-sm">{supervisor.users?.phone || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-gray-500 text-xs flex items-center gap-1">
                              <BadgeCheck className="w-3 h-3" />
                              Employee ID
                            </span>
                            <span className="text-gray-900 font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              {supervisor.employeeId}
                            </span>
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-gray-500 text-xs flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Registered
                            </span>
                            <span className="text-gray-900 text-xs sm:text-sm">{formatDate(supervisor.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Work Information */}
                      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                          <div className="p-1.5 bg-purple-100 rounded-lg">
                            <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                          </div>
                          Work Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-gray-500 text-xs">Type</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              supervisor.supervisorType === 'GENERAL_SUPERVISOR'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {supervisor.supervisorType === 'GENERAL_SUPERVISOR' ? 'General' : 'Supervisor'}
                            </span>
                          </div>
                          {supervisor.supervisorType === 'GENERAL_SUPERVISOR' ? (
                            <>
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-gray-500 text-xs flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  Region
                                </span>
                                <span className="text-gray-900 text-xs sm:text-sm">{supervisor.regionAssigned || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-gray-500 text-xs">Visit Frequency</span>
                                <span className="text-gray-900 text-xs sm:text-sm">{supervisor.visitSchedule || 'N/A'}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-gray-500 text-xs flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  Location
                                </span>
                                <span className="text-gray-900 text-xs sm:text-sm">{supervisor.locations?.name || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-gray-500 text-xs">Shift Type</span>
                                <span className="text-gray-900 text-xs sm:text-sm">{supervisor.shiftType || 'N/A'}</span>
                              </div>
                              {supervisor.generalSupervisor && (
                                <div className="flex justify-between items-start gap-2">
                                  <span className="text-gray-500 text-xs">Reports To</span>
                                  <span className="text-gray-900 text-xs sm:text-sm">
                                    {supervisor.generalSupervisor.users?.firstName} {supervisor.generalSupervisor.users?.lastName}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                          {supervisor.bitsAssigned && supervisor.bitsAssigned.length > 0 && (
                            <div className="pt-2 border-t border-gray-100">
                              <span className="text-gray-500 text-xs">Assigned Bits:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {supervisor.bitsAssigned.map((bit, index) => (
                                  <span key={index} className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs">
                                    {bit}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Salary & Bank Information */}
                      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                          <div className="p-1.5 bg-green-100 rounded-lg">
                            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                          </div>
                          Salary & Bank
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-gray-500 text-xs">Category</span>
                            <span className="text-gray-900 text-xs sm:text-sm">{supervisor.salaryCategory || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-gray-500 text-xs">Base Salary</span>
                            <span className="text-gray-900 font-semibold text-green-700 text-xs sm:text-sm">
                              {formatCurrency(supervisor.salary)}
                            </span>
                          </div>
                          {supervisor.allowance && (
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-gray-500 text-xs">Allowance</span>
                              <span className="text-gray-900 text-xs sm:text-sm">{formatCurrency(supervisor.allowance)}</span>
                            </div>
                          )}
                          <div className="pt-2 mt-2 border-t border-gray-100">
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <span className="text-gray-500 text-xs flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />
                                Bank
                              </span>
                              <span className="text-gray-900 text-xs sm:text-sm">
                                {(supervisor as any).bankName || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-gray-500 text-xs">Account No.</span>
                              <span className="text-gray-900 font-mono text-xs">
                                {(supervisor as any).bankAccountNumber || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Registration Info Banner */}
                    {supervisor.registeredBy && (
                      <div className="mt-3 sm:mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <span className="font-medium text-amber-800 text-sm">Registration Details</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
                          <div>
                            <span className="text-amber-700 block text-xs">Registered By</span>
                            <span className="text-amber-900 font-medium">
                              {supervisor.registeredBy.firstName} {supervisor.registeredBy.lastName}
                            </span>
                          </div>
                          <div>
                            <span className="text-amber-700 block text-xs">Manager Email</span>
                            <span className="text-amber-900 text-xs truncate block">{supervisor.registeredBy.email}</span>
                          </div>
                          <div>
                            <span className="text-amber-700 block text-xs">Date Submitted</span>
                            <span className="text-amber-900">{formatDate(supervisor.createdAt)}</span>
                          </div>
                          <div>
                            <span className="text-amber-700 block text-xs">Status</span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded-full text-xs font-medium">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons - Prominent at Bottom */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleApprove(supervisor)}
                        disabled={processingId === supervisor.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 active:bg-green-800 disabled:opacity-50 transition-colors font-medium text-sm sm:text-base"
                      >
                        {processingId === supervisor.id ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                        Approve Supervisor
                      </button>
                      <button
                        onClick={() => openRejectModal(supervisor.id)}
                        disabled={processingId === supervisor.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 active:bg-red-300 disabled:opacity-50 transition-colors font-medium text-sm sm:text-base"
                      >
                        <XCircle className="w-5 h-5" />
                        Reject Registration
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal - Mobile Optimized */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[9999]">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-none relative z-[10000]">
            {/* Handle bar for mobile */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Reject Registration</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this supervisor registration. This will be sent to the manager.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4 resize-none"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingId(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 active:bg-gray-100 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || processingId === rejectingId}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-sm font-medium"
              >
                {processingId === rejectingId ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approved Credentials Modal - Mobile Optimized */}
      {approvedCredentials && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[9999]">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-none relative z-[10000]">
            {/* Handle bar for mobile */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">General Supervisor Approved!</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium">{approvedCredentials.supervisorName}</span> has been approved. 
              The manager has been notified with the login credentials.
            </p>
            
            <div className="bg-gray-50 rounded-xl p-3 space-y-3 mb-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500">Employee ID</span>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded text-xs font-mono border border-gray-200">
                    {approvedCredentials.credentials.employeeId}
                  </code>
                  <button
                    onClick={() => copyToClipboard(approvedCredentials.credentials.employeeId, 'employeeId')}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded active:bg-gray-300"
                  >
                    {copiedField === 'employeeId' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500">Email</span>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded text-xs border border-gray-200 truncate max-w-[140px]">
                    {approvedCredentials.credentials.email}
                  </code>
                  <button
                    onClick={() => copyToClipboard(approvedCredentials.credentials.email, 'email')}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded active:bg-gray-300"
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500">Password</span>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded text-xs font-mono border border-gray-200">
                    {approvedCredentials.credentials.temporaryPassword}
                  </code>
                  <button
                    onClick={() => copyToClipboard(approvedCredentials.credentials.temporaryPassword, 'password')}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded active:bg-gray-300"
                  >
                    {copiedField === 'password' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>These credentials have been sent to the manager. The General Supervisor must change their password on first login.</p>
            </div>

            <button
              onClick={() => setApprovedCredentials(null)}
              className="w-full px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 active:bg-gray-700 text-sm font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
