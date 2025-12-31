import { useState, useEffect } from 'react';
import {
  Clock,
  Check,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Eye,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getImageUrl } from '../../lib/api';

interface PendingSupervisor {
  id?: string;
  _id?: string;
  fullName: string;
  employeeId: string;
  supervisorType: 'SUPERVISOR' | 'GENERAL_SUPERVISOR';
  approvalStatus: string;
  createdAt: string;
  regionAssigned?: string;
  shiftType?: string;
  visitSchedule?: string;
  salary: number;
  salaryCategory: string;
  userId?: {
    id: string;
    email: string;
    phone?: string;
    phoneNumber?: string;
    firstName: string;
    lastName: string;
    passportPhoto?: string;
    profilePhoto?: string;
    createdAt: string;
  };
  locationId?: {
    id: string;
    name: string;
    address: string;
  };
  generalSupervisorId?: {
    fullName: string;
    userId: {
      firstName: string;
      lastName: string;
    };
  };
  registeredBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function ManagerPendingApprovalsPage() {
  const [pendingSupervisors, setPendingSupervisors] = useState<PendingSupervisor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to get supervisor ID (handles both id and _id)
  const getSupervisorId = (supervisor: PendingSupervisor) => supervisor.id || supervisor._id || '';
    const [showCredentials, setShowCredentials] = useState(false);
    const [generatedCredentials, setGeneratedCredentials] = useState<{
      employeeId: string;
      email: string;
      temporaryPassword: string;
    } | null>(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/supervisors/pending-approvals');
      console.log('📋 Pending Approvals Response:', response.data);
      console.log('📋 First Supervisor Data:', response.data[0]);
      setPendingSupervisors(response.data);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      toast.error('Failed to load pending approvals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (supervisorId: string) => {
    try {
      setIsProcessing(true);
        const response = await api.post(`/supervisors/${supervisorId}/approve`);
        if (response.data.credentials) {
          setGeneratedCredentials(response.data.credentials);
          setShowCredentials(true);
        }
        toast.success('Supervisor approved successfully!');
      fetchPendingApprovals();
    } catch (error: any) {
      console.error('Error approving supervisor:', error);
      toast.error(error.response?.data?.error || 'Failed to approve supervisor');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (supervisorId: string) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setIsProcessing(true);
      await api.post(`/supervisors/${supervisorId}/reject`, { reason: rejectReason });
      toast.success('Supervisor rejected');
      setRejectingId(null);
      setRejectReason('');
      fetchPendingApprovals();
    } catch (error: any) {
      console.error('Error rejecting supervisor:', error);
      toast.error(error.response?.data?.error || 'Failed to reject supervisor');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-gray-600 mt-1">
            Review and approve supervisor registrations from General Supervisors
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg">
          <Clock className="w-5 h-5" />
          <span className="font-medium">{pendingSupervisors.length} Pending</span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Approval Flow</p>
            <p className="text-xs text-blue-700 mt-1">
              These supervisors were registered by General Supervisors and require your approval. 
              Upon approval, login credentials will be generated and sent to the registering General Supervisor.
            </p>
          </div>
        </div>
      </div>

      {/* Pending List */}
      {pendingSupervisors.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-500">There are no pending supervisor approvals at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingSupervisors.map((supervisor) => (
            <div
              key={getSupervisorId(supervisor)}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Main Card */}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Photo */}
                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    {(supervisor.userId?.passportPhoto || supervisor.userId?.profilePhoto) ? (
                      <img
                        src={getImageUrl(supervisor.userId.passportPhoto || supervisor.userId.profilePhoto || '')}
                        alt={supervisor.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {supervisor.fullName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            Supervisor
                          </span>
                          <span className="text-xs text-gray-500">
                            {supervisor.employeeId}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      <div key="email" className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{supervisor.userId?.email || 'N/A'}</span>
                      </div>
                      <div key="phone" className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{supervisor.userId?.phone || supervisor.userId?.phoneNumber || 'N/A'}</span>
                      </div>
                      {supervisor.locationId && (
                        <div key="location" className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{supervisor.locationId.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Additional Info Row */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-xs text-gray-500">Shift: </span>
                          <span className="font-medium">{supervisor.shiftType || 'Not set'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-xs text-gray-500">Schedule: </span>
                          <span className="font-medium">{supervisor.visitSchedule || 'Not set'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-xs text-gray-500">Registered: </span>
                          <span className="font-medium">{formatDate(supervisor.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Registered By */}
                    {supervisor.registeredBy && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Registered by:{' '}
                          <span className="font-medium text-gray-700">
                            {supervisor.registeredBy.firstName} {supervisor.registeredBy.lastName}
                          </span>{' '}
                          (General Supervisor)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setExpandedId(expandedId === getSupervisorId(supervisor) ? null : getSupervisorId(supervisor))}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Eye className="w-4 h-4" />
                    {expandedId === getSupervisorId(supervisor) ? 'Hide Details' : 'View Details'}
                    {expandedId === getSupervisorId(supervisor) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setRejectingId(getSupervisorId(supervisor))}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(getSupervisorId(supervisor))}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === getSupervisorId(supervisor) && (
                <div className="px-6 pb-6 bg-gray-50 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Shift Type</p>
                      <p className="font-medium text-gray-900">{supervisor.shiftType || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Visit Schedule</p>
                      <p className="font-medium text-gray-900">{supervisor.visitSchedule || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Salary</p>
                      <p className="font-medium text-gray-900">{formatCurrency(supervisor.salary)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Salary Category</p>
                      <p className="font-medium text-gray-900">{supervisor.salaryCategory}</p>
                    </div>
                    {supervisor.generalSupervisorId && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reports To</p>
                        <p className="font-medium text-gray-900">
                          {supervisor.generalSupervisorId.userId.firstName} {supervisor.generalSupervisorId.userId.lastName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rejection Modal */}
              {rejectingId === getSupervisorId(supervisor) && (
                <div className="px-6 pb-6 bg-red-50 border-t border-red-200">
                  <div className="pt-4">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Reject Registration</p>
                        <p className="text-xs text-red-700 mt-1">
                          Please provide a reason for rejection. The General Supervisor will be notified.
                        </p>
                      </div>
                    </div>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      rows={3}
                      className="w-full px-4 py-3 border border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <div className="flex items-center justify-end gap-3 mt-4">
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason('');
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReject(getSupervisorId(supervisor))}
                        disabled={isProcessing || !rejectReason.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

        {/* Credentials Modal */}
        {showCredentials && generatedCredentials && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Supervisor Approved!
                </h2>
                <p className="text-gray-600">
                  Login credentials have been generated. Share these with the General Supervisor.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Employee ID</p>
                  <p className="font-mono font-semibold text-gray-900">{generatedCredentials.employeeId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                  <p className="font-mono text-gray-900">{generatedCredentials.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Temporary Password</p>
                  <p className="font-mono font-semibold text-gray-900 bg-yellow-50 p-2 rounded border border-yellow-200">
                    {generatedCredentials.temporaryPassword}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> The General Supervisor will be notified via their notification panel. 
                  You can also share these credentials directly.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowCredentials(false);
                  setGeneratedCredentials(null);
                }}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
              >
                Done
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
