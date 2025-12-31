import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Shield,
  X,
  Loader2,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getImageUrl } from '../../lib/api';

interface Operator {
  id: string;
  userId: string;
  employeeId: string;
  users: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    gender: string;
    dateOfBirth: string;
    state: string;
    lga: string;
    profilePhoto: string;
    createdAt: string;
  };
  supervisors: {
    users: {
      firstName: string;
      lastName: string;
    };
  };
  locations: {
    id: string;
    name: string;
    address: string;
  } | null;
}

export default function OperatorApprovalsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [salary, setSalary] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    fetchPendingOperators();
  }, []);

  const fetchPendingOperators = async () => {
    try {
      const response = await api.get('/operators/pending-approvals');
      const operators = response.data.operators || [];
      // Transform data to match expected format
      const transformedOperators = operators.map((op: any) => ({
        id: op._id,
        userId: op.userId?._id,
        employeeId: op.employeeId,
        users: {
          id: op.userId?._id,
          email: op.userId?.email,
          firstName: op.userId?.firstName,
          lastName: op.userId?.lastName,
          phone: op.userId?.phone,
          gender: op.userId?.gender,
          dateOfBirth: op.userId?.dateOfBirth,
          state: op.userId?.state,
          lga: op.userId?.lga,
          profilePhoto: op.userId?.profilePhoto || op.passportPhoto,
          passportPhoto: op.passportPhoto,
          createdAt: op.userId?.createdAt,
        },
        supervisors: {
          users: {
            firstName: op.supervisorId?.userId?.firstName || 'Unknown',
            lastName: op.supervisorId?.userId?.lastName || '',
          },
        },
        locations: op.locationId ? {
          id: op.locationId._id,
          name: op.locationId.name,
          address: op.locationId.address,
        } : null,
      }));
      setOperators(transformedOperators);
    } catch (error) {
      console.error('Error fetching operators:', error);
      toast.error('Failed to load pending operators');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedOperator || !salary) {
      toast.error('Please enter operator salary');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post(`/operators/${selectedOperator.id}/approve`, {
        salary: parseFloat(salary),
      });
      toast.success('Operator approved successfully!');
      setCredentials(response.data.credentials);
      fetchPendingOperators();
      setShowApproveModal(false);
    } catch (error: any) {
      console.error('Error approving operator:', error);
      toast.error(error.response?.data?.error || 'Failed to approve operator');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedOperator || !rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/operators/${selectedOperator.id}/reject`, {
        reason: rejectionReason,
      });
      toast.success('Operator rejected');
      fetchPendingOperators();
      setShowRejectModal(false);
      setSelectedOperator(null);
      setRejectionReason('');
    } catch (error: any) {
      console.error('Error rejecting operator:', error);
      toast.error(error.response?.data?.error || 'Failed to reject operator');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOperators = operators.filter((op) =>
    `${op.users.firstName} ${op.users.lastName} ${op.users.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Operator Approvals</h1>
          <p className="text-gray-600 mt-1">
            Review and approve operator registrations from supervisors
          </p>
        </div>
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-semibold">
          {operators.length} Pending
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search operators..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Operators List */}
      {filteredOperators.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Approvals</h3>
          <p className="text-gray-600">
            {searchTerm
              ? 'No operators match your search'
              : 'All operator registrations have been processed'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOperators.map((operator) => (
            <div
              key={operator.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                {/* Operator Info */}
                <div className="flex items-start gap-4 mb-4">
                  {operator.users?.profilePhoto || operator.users?.passportPhoto ? (
                    <img
                      src={getImageUrl(operator.users.profilePhoto || operator.users.passportPhoto)}
                      alt={`${operator.users?.firstName} ${operator.users?.lastName}`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-semibold text-lg">
                      {operator.users?.firstName?.[0]}
                      {operator.users?.lastName?.[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {operator.users.firstName} {operator.users.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">{operator.employeeId}</p>
                    <span className="inline-flex items-center gap-1 px-2 py-1 mt-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock size={12} />
                      Pending
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={14} className="flex-shrink-0" />
                    <span className="truncate">{operator.users.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={14} className="flex-shrink-0" />
                    <span>{operator.users.phone}</span>
                  </div>
                  {operator.locations && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={14} className="flex-shrink-0" />
                      <span className="truncate">{operator.locations.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Shield size={14} className="flex-shrink-0" />
                    <span className="truncate">
                      By: {operator.supervisors.users.firstName} {operator.supervisors.users.lastName}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedOperator(operator);
                      setShowApproveModal(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOperator(operator);
                      setShowRejectModal(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedOperator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Approve Operator</h2>
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedOperator(null);
                    setSalary('');
                    setCredentials(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {credentials ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800 font-semibold mb-3">
                      <CheckCircle size={20} />
                      Operator Approved Successfully!
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700">
                        <strong>Email:</strong> {credentials.email}
                      </p>
                      <p className="text-gray-700">
                        <strong>Temporary Password:</strong>{' '}
                        <code className="bg-gray-100 px-2 py-1 rounded">{credentials.password}</code>
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Please share these credentials with the operator securely. They will be required
                    to change the password on first login.
                  </p>
                  <button
                    onClick={() => {
                      setShowApproveModal(false);
                      setSelectedOperator(null);
                      setSalary('');
                      setCredentials(null);
                    }}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                      You are approving:{' '}
                      <strong>
                        {selectedOperator.users.firstName} {selectedOperator.users.lastName}
                      </strong>
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Salary (₦) *
                      </label>
                      <input
                        type="number"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                        placeholder="Enter salary amount"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="0"
                        step="1000"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowApproveModal(false);
                        setSelectedOperator(null);
                        setSalary('');
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={isSubmitting || !salary}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Approving...' : 'Approve'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedOperator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Reject Operator</h2>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedOperator(null);
                    setRejectionReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  You are rejecting:{' '}
                  <strong>
                    {selectedOperator.users.firstName} {selectedOperator.users.lastName}
                  </strong>
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this operator is being rejected..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedOperator(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isSubmitting || !rejectionReason}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
