import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  DollarSign,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
  Info
} from 'lucide-react';
import { api, getImageUrl } from '../../../lib/api';
import { toast } from 'react-hot-toast';

interface OperatorDetail {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profilePhoto?: string;
    status: string;
    createdAt: string;
  };
  supervisorId: {
    _id: string;
    userId: {
      firstName: string;
      lastName: string;
    };
  };
  locationId: {
    _id: string;
    name: string;
    address: string;
    isActive: boolean;
  };
  passportPhoto?: string;
  salary?: number;
  emergencyContact?: string;
  approvalStatus: string;
  registeredBy: string;
  createdAt: string;
}

export default function OperatorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [operator, setOperator] = useState<OperatorDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOperatorDetails();
  }, [id]);

  const fetchOperatorDetails = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching operator details for ID:', id);
      const response = await api.get(`/general-supervisor/operators/${id}`);
      console.log('✅ Operator details received:', response.data);
      setOperator(response.data.operator);
    } catch (error: any) {
      console.error('❌ Error fetching operator details:', error);
      toast.error(error.response?.data?.message || 'Failed to load operator details');
      // Navigate back if operator not found
      if (error.response?.status === 404) {
        setTimeout(() => navigate('/general-supervisor/operators'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Operator not found</h3>
          <div className="mt-6">
            <Link
              to="/general-supervisor/operators"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Operators
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/general-supervisor/operators"
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Operators List
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Operator Profile</h1>
        </div>

        {/* Notice Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">View Only</h3>
              <p className="text-sm text-blue-700 mt-1">
                As a General Supervisor, you can view operator details but cannot edit them. Contact the Manager for any changes.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-24"></div>
              <div className="relative px-6 pb-6">
                <div className="relative -mt-12 mb-4">
                  {operator.passportPhoto ? (
                    <img
                      src={operator.passportPhoto}
                      alt={`${operator.userId.firstName} ${operator.userId.lastName}`}
                      className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <User className="h-12 w-12 text-white" />
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {operator.userId.firstName} {operator.userId.lastName}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(operator.userId.status)}`}>
                      {operator.userId.status}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getApprovalStatusColor(operator.approvalStatus)}`}>
                      {operator.approvalStatus}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{operator.userId.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{operator.userId.phone}</span>
                  </div>
                  {operator.emergencyContact && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-red-400" />
                      <div>
                        <p className="text-xs text-gray-500">Emergency Contact</p>
                        <span className="text-gray-700">{operator.emergencyContact}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Joined</p>
                      <span className="text-gray-700">{formatDate(operator.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Salary Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Salary Information</h3>
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Monthly Salary</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(operator.salary)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assignment Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Assignment Information</h3>
                <Shield className="h-5 w-5 text-blue-600" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Supervisor */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Supervisor</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {operator.supervisorId.userId.firstName} {operator.supervisorId.userId.lastName}
                      </p>
                      <p className="text-xs text-gray-500">Direct Supervisor</p>
                    </div>
                  </div>
                </div>

                {/* Registered By */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Registered By</p>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{operator.registeredBy ? operator.registeredBy.replace(/_/g, ' ') : 'N/A'}</p>
                      <p className="text-xs text-gray-500">Role</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location/Beat Information */}
            {operator.locationId && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Location / Beat Assignment</h3>
                  <Building className="h-5 w-5 text-blue-600" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <Building className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{operator.locationId.name}</h4>
                        {operator.locationId.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            Inactive
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="break-words">{operator.locationId.address || 'Address not available'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Location ID</p>
                        <p className="font-medium text-gray-900 font-mono text-xs">{operator.locationId._id.slice(-8)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <p className="font-medium text-gray-900">{operator.locationId.isActive ? 'Operational' : 'Not Operational'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Operator ID</p>
                  <p className="text-sm font-mono text-gray-900">{operator._id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="text-sm font-mono text-gray-900">{operator.userId._id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Registration Date</p>
                  <p className="text-sm text-gray-900">{formatDate(operator.userId.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-sm text-gray-900">{formatDate(operator.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
