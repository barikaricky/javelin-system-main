import { X, Mail, Phone, MapPin, Shield, Calendar, DollarSign, Grid3x3, User, CreditCard } from 'lucide-react';
import { getImageUrl } from '../../lib/api';

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
  supervisorId?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  salary?: number;
  bankName?: string;
  bankAccount?: string;
  status: string;
  createdAt: string;
  startDate?: string;
}

interface OperatorDetailModalProps {
  operator: Operator | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OperatorDetailModal({ operator, isOpen, onClose }: OperatorDetailModalProps) {
  if (!isOpen || !operator) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <User className="w-6 h-6" />
              Operator Details
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Profile Section */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              {operator.userId.profilePhoto ? (
                <img
                  src={getImageUrl(operator.userId.profilePhoto)}
                  alt={`${operator.userId.firstName} ${operator.userId.lastName}`}
                  className="w-20 h-20 rounded-full object-cover border-4 border-purple-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-purple-100">
                  {operator.userId.firstName?.[0]}
                  {operator.userId.lastName?.[0]}
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {operator.userId.firstName} {operator.userId.lastName}
                </h3>
                <p className="text-gray-600 font-mono text-sm mt-1">{operator.employeeId}</p>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    operator.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : operator.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {operator.status}
                </span>
              </div>
            </div>

            {/* Information Grid */}
            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-purple-600" />
                  Contact Information
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email Address</p>
                      <p className="text-sm font-medium text-gray-900">{operator.userId.email}</p>
                    </div>
                  </div>
                  {operator.userId.phoneNumber && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                        <p className="text-sm font-medium text-gray-900">{operator.userId.phoneNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Details */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  Assignment Details
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  {operator.locationId ? (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Location</p>
                        <p className="text-sm font-medium text-gray-900">{operator.locationId.locationName}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No location assigned</p>
                  )}
                  
                  {operator.bitId ? (
                    <div className="flex items-start gap-3">
                      <Grid3x3 className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Bit</p>
                        <p className="text-sm font-medium text-gray-900">{operator.bitId.bitName}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No bit assigned</p>
                  )}

                  {operator.supervisorId && (
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Supervisor</p>
                        <p className="text-sm font-medium text-gray-900">
                          {operator.supervisorId.firstName} {operator.supervisorId.lastName}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  Financial Information
                </h4>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Monthly Salary</p>
                      <p className="text-lg font-bold text-green-700">
                        {operator.salary ? formatCurrency(operator.salary) : 'Not set'}
                      </p>
                    </div>
                  </div>
                  {operator.bankName && operator.bankAccount && (
                    <div className="flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Bank Details</p>
                        <p className="text-sm font-medium text-gray-900">{operator.bankName}</p>
                        <p className="text-xs text-gray-600 mt-0.5 font-mono">{operator.bankAccount}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Important Dates
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Registered On</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(operator.createdAt)}</p>
                    </div>
                  </div>
                  {operator.startDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Start Date</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(operator.startDate)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
