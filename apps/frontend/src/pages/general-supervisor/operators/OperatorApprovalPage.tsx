import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, MapPin, Phone, Mail, Eye, Calendar, Shield, Briefcase, AlertCircle } from 'lucide-react';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';

interface PendingOperator {
  _id: string;
  employeeId: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender?: string;
    dateOfBirth?: string;
    state?: string;
    lga?: string;
    profilePhoto?: string;
    passportPhoto?: string;
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
    createdAt: string;
  };
  supervisorId: {
    _id: string;
    userId: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  };
  locationId?: {
    _id: string;
    name: string;
    address: string;
    state: string;
    lga: string;
  };
  salary: number;
  startDate: string;
  createdAt: string;
}

export default function OperatorApprovalPage() {
  const [operators, setOperators] = useState<PendingOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOperator, setSelectedOperator] = useState<PendingOperator | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingOperators();
  }, []);

  const fetchPendingOperators = async () => {
    setLoading(true);
    try {
      const response = await api.get('/operators/pending');
      const data = response.data.operators || [];
      console.log('📊 Fetched operators:', data);
      console.log('📊 First operator structure:', data[0]);
      setOperators(data);
    } catch (error: any) {
      console.error('Error fetching operators:', error);
      toast.error(error.response?.data?.error || 'Failed to load operators');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (operatorId: string) => {
    const salaryInput = prompt('Enter monthly salary for this operator (₦):');
    if (!salaryInput) return;
    
    const salary = parseFloat(salaryInput);
    if (isNaN(salary) || salary <= 0) {
      toast.error('Please enter a valid salary amount');
      return;
    }

    setActionLoading(true);
    try {
      const response = await api.post(`/operators/${operatorId}/approve`, { salary });
      toast.success('Operator approved successfully!');
      
      // Show credentials if returned
      if (response.data.credentials) {
        alert(`Operator Approved!\n\nEmail: ${response.data.credentials.email}\nTemporary Password: ${response.data.credentials.password}\n\nPlease share these credentials securely.`);
      }
      
      fetchPendingOperators();
      setShowModal(false);
    } catch (error: any) {
      console.error('Error approving operator:', error);
      toast.error(error.response?.data?.error || 'Failed to approve operator');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (operatorId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setActionLoading(true);
    try {
      await api.post(`/operators/${operatorId}/reject`, { reason });
      toast.success('Operator registration rejected');
      fetchPendingOperators();
      setShowModal(false);
    } catch (error: any) {
      console.error('Error rejecting operator:', error);
      toast.error(error.response?.data?.message || 'Failed to reject operator');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Operator Approvals
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Review and approve operator registrations from supervisors
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pending Approval', count: operators.length, color: 'from-yellow-500 to-orange-500', icon: Clock },
            { label: 'Under Your Supervision', count: operators.length, color: 'from-blue-500 to-indigo-500', icon: Shield },
            { label: 'Total Operators', count: operators.length, color: 'from-purple-500 to-pink-500', icon: User },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm p-6 transform hover:scale-105 transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.count}</p>
                </div>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${stat.color} flex items-center justify-center text-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Operators List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : operators.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center animate-fade-in">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending operators</h3>
            <p className="text-gray-600">
              No operator registrations are awaiting your approval at this time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {operators.map((operator, index) => (
              <div
                key={operator._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden transform hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {operator.userId?.passportPhoto || operator.userId?.profilePhoto ? (
                        <img
                          src={operator.userId.passportPhoto || operator.userId.profilePhoto}
                          alt={`${operator.userId.firstName} ${operator.userId.lastName}`}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-blue-100"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold">
                          {operator.userId?.firstName?.charAt(0)}{operator.userId?.lastName?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          {operator.userId?.firstName} {operator.userId?.lastName}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">{operator.employeeId}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(operator.userId?.status || 'PENDING')}`}>
                      {getStatusIcon(operator.userId?.status || 'PENDING')}
                      {operator.userId?.status || 'PENDING'}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{operator.userId?.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{operator.userId?.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="truncate">{operator.locationId?.name || 'Not assigned'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Briefcase className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <span>{operator.locationId?.state || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
                      <Shield className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span className="truncate">Supervisor: {operator.supervisorId?.userId?.firstName} {operator.supervisorId?.userId?.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
                      <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <span>Applied: {new Date(operator.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedOperator(operator);
                        setShowModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-sm inline-flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleApprove(operator._id)}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(operator._id)}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-medium text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedOperator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold">Operator Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile */}
              <div className="flex items-center gap-4">
                {selectedOperator.userId?.passportPhoto || selectedOperator.userId?.profilePhoto ? (
                  <img
                    src={selectedOperator.userId.passportPhoto || selectedOperator.userId.profilePhoto}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-4 border-blue-100"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedOperator.userId?.firstName?.charAt(0)}{selectedOperator.userId?.lastName?.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedOperator.userId?.firstName} {selectedOperator.userId?.lastName}
                  </h3>
                  <p className="text-gray-600">{selectedOperator.employeeId}</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border mt-2 ${getStatusColor(selectedOperator.userId?.status || 'PENDING')}`}>
                    {getStatusIcon(selectedOperator.userId?.status || 'PENDING')}
                    {selectedOperator.userId?.status || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Personal Info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium text-gray-900">{selectedOperator.userId?.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium text-gray-900">{selectedOperator.userId?.phone}</p>
                  </div>
                  {selectedOperator.userId?.gender && (
                    <div>
                      <span className="text-gray-600">Gender:</span>
                      <p className="font-medium text-gray-900">{selectedOperator.userId.gender}</p>
                    </div>
                  )}
                  {selectedOperator.userId?.dateOfBirth && (
                    <div>
                      <span className="text-gray-600">Date of Birth:</span>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedOperator.userId.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedOperator.userId?.state && (
                    <div className="sm:col-span-2">
                      <span className="text-gray-600">State/LGA:</span>
                      <p className="font-medium text-gray-900">{selectedOperator.userId.state}{selectedOperator.userId.lga ? ` / ${selectedOperator.userId.lga}` : ''}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Work Info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  Work Assignment
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <p className="font-medium text-gray-900">{selectedOperator.locationId?.name || 'Not assigned'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Address:</span>
                    <p className="font-medium text-gray-900">{selectedOperator.locationId?.address || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">State:</span>
                    <p className="font-medium text-gray-900">{selectedOperator.locationId?.state || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">LGA:</span>
                    <p className="font-medium text-gray-900">{selectedOperator.locationId?.lga || 'N/A'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-600">Supervisor:</span>
                    <p className="font-medium text-gray-900">
                      {selectedOperator.supervisorId?.userId?.firstName} {selectedOperator.supervisorId?.userId?.lastName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleApprove(selectedOperator._id)}
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  {actionLoading ? 'Approving...' : 'Approve Operator'}
                </button>
                <button
                  onClick={() => handleReject(selectedOperator._id)}
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  {actionLoading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
