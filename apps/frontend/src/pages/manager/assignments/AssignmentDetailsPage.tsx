import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Phone,
  Mail,
  Shield,
  Briefcase,
  FileText,
  DollarSign,
  Edit,
  Trash2,
} from 'lucide-react';

interface Assignment {
  _id: string;
  operatorId: {
    _id: string;
    employeeId: string;
    userId: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      state: string;
      profilePhoto?: string;
    };
  };
  beatId: {
    _id: string;
    beatCode: string;
    beatName: string;
    client?: {
      clientName: string;
    };
  };
  locationId: {
    _id: string;
    name: string;
    locationName: string;
    state: string;
    city: string;
    address: string;
  };
  supervisorId: {
    _id: string;
    userId: {
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
    };
  };
  shiftType: string;
  assignmentType: string;
  startDate: string;
  endDate?: string;
  status: string;
  assignedBy: {
    name: string;
    role: string;
  };
  approvedBy?: {
    name: string;
    role: string;
  };
  approvedAt?: string;
  specialInstructions?: string;
  allowances?: Array<{
    type: string;
    amount: number;
    reason: string;
  }>;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AssignmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAssignment();
    }
  }, [id]);

  const fetchAssignment = async () => {
    try {
      const response = await api.get(`/assignments/${id}`);
      setAssignment(response.data.assignment);
    } catch (error: any) {
      console.error('Error fetching assignment:', error);
      toast.error('Failed to load assignment details');
      navigate('/manager/assignments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string; bg: string }> = {
      ACTIVE: { color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle, label: 'Active' },
      PENDING: { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock, label: 'Pending Approval' },
      REJECTED: { color: 'text-red-700', bg: 'bg-red-100', icon: XCircle, label: 'Rejected' },
      ENDED: { color: 'text-gray-700', bg: 'bg-gray-100', icon: AlertTriangle, label: 'Ended' },
      TRANSFERRED: { color: 'text-blue-700', bg: 'bg-blue-100', icon: MapPin, label: 'Transferred' },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center px-4 py-2 rounded-full ${config.bg} ${config.color} font-medium`}>
        <Icon className="w-5 h-5 mr-2" />
        {config.label}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <Clock className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse mx-auto"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading assignment details...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Assignment Not Found</h3>
          <p className="text-gray-600 mb-6">The assignment you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/manager/assignments')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 animate-slide-in-top">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/manager/assignments')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Assignment Details</h1>
            <p className="text-gray-600 mt-1">Complete information about this guard assignment</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {getStatusBadge(assignment.status)}
        </div>
      </div>

      {/* Guard Information */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden animate-slide-in-left">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <User className="w-6 h-6 mr-2" />
            Guard Information
          </h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden shadow-lg">
                {assignment.operatorId?.userId?.profilePhoto ? (
                  <img
                    src={assignment.operatorId.userId.profilePhoto}
                    alt={assignment.operatorId?.userId?.firstName || 'Guard'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-full h-full p-8 text-white" />
                )}
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-lg font-semibold text-gray-900">
                  {assignment.operatorId?.userId?.firstName || 'N/A'} {assignment.operatorId?.userId?.lastName || ''}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Employee ID</label>
                <p className="text-lg font-semibold text-gray-900">{assignment.operatorId?.employeeId || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  Phone Number
                </label>
                <p className="text-lg text-gray-900">
                  {assignment.operatorId?.userId?.phone || 
                   assignment.operatorId?.userId?.phoneNumber || 
                   'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  Email Address
                </label>
                <p className="text-lg text-gray-900">{assignment.operatorId?.userId?.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  State
                </label>
                <p className="text-lg text-gray-900">{assignment.operatorId?.userId?.state || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BEAT Information */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden animate-slide-in-bottom">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Shield className="w-6 h-6 mr-2" />
              BEAT Information
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">BEAT Name</label>
              <p className="text-lg font-semibold text-gray-900">{assignment.beatId?.beatName || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">BEAT Code</label>
              <p className="text-lg text-gray-900">{assignment.beatId?.beatCode || 'N/A'}</p>
            </div>
            {assignment.beatId?.client && (
              <div>
                <label className="text-sm font-medium text-gray-500">Client</label>
                <p className="text-lg text-gray-900">{assignment.beatId.client.clientName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden animate-slide-in-bottom" style={{ animationDelay: '100ms' }}>
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <MapPin className="w-6 h-6 mr-2" />
              Location Information
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Location Name</label>
              <p className="text-lg font-semibold text-gray-900">{assignment.locationId?.locationName || assignment.locationId?.name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">City</label>
              <p className="text-lg text-gray-900">{assignment.locationId?.city || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">State</label>
              <p className="text-lg text-gray-900">{assignment.locationId?.state || 'N/A'}</p>
            </div>
            {assignment.locationId?.address && (
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-lg text-gray-900">{assignment.locationId.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Supervisor Information */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden animate-slide-in-bottom" style={{ animationDelay: '200ms' }}>
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Briefcase className="w-6 h-6 mr-2" />
              Supervisor Information
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Supervisor Name</label>
              <p className="text-lg font-semibold text-gray-900">
                {assignment.supervisorId?.userId?.firstName || 'N/A'} {assignment.supervisorId?.userId?.lastName || ''}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center">
                <Phone className="w-4 h-4 mr-1" />
                Phone Number
              </label>
              <p className="text-lg text-gray-900">{assignment.supervisorId?.userId?.phone || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center">
                <Mail className="w-4 h-4 mr-1" />
                Email Address
              </label>
              <p className="text-lg text-gray-900">{assignment.supervisorId?.userId?.email || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Assignment Schedule */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden animate-slide-in-bottom" style={{ animationDelay: '300ms' }}>
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Calendar className="w-6 h-6 mr-2" />
              Schedule & Type
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Assignment Type</label>
              <p className="text-lg font-semibold text-gray-900">{assignment.assignmentType || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Shift Type</label>
              <p className="text-lg text-gray-900">{assignment.shiftType ? assignment.shiftType.replace('_', ' ') : 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Start Date</label>
              <p className="text-lg text-gray-900">{new Date(assignment.startDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
            {assignment.endDate && (
              <div>
                <label className="text-sm font-medium text-gray-500">End Date</label>
                <p className="text-lg text-gray-900">{new Date(assignment.endDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {(assignment.specialInstructions || assignment.allowances?.length || assignment.rejectionReason) && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden animate-slide-in-right">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <FileText className="w-6 h-6 mr-2" />
              Additional Information
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {assignment.specialInstructions && (
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Special Instructions</label>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-900">{assignment.specialInstructions}</p>
                </div>
              </div>
            )}

            {assignment.allowances && assignment.allowances.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Allowances
                </label>
                <div className="space-y-2">
                  {assignment.allowances.map((allowance, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{allowance.type}</p>
                        {allowance.reason && <p className="text-sm text-gray-600 mt-1">{allowance.reason}</p>}
                      </div>
                      <p className="font-semibold text-green-600">₦{allowance.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {assignment.rejectionReason && (
              <div>
                <label className="text-sm font-medium text-red-600 mb-2 block">Rejection Reason</label>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-red-900">{assignment.rejectionReason}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-white rounded-xl shadow-md p-6 animate-slide-in-bottom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          <div>
            <label className="text-gray-500 font-medium">Assigned By</label>
            <p className="text-gray-900 font-semibold mt-1">{assignment.assignedBy?.name || 'N/A'}</p>
            <p className="text-gray-600 text-xs">{assignment.assignedBy?.role || ''}</p>
          </div>
          {assignment.approvedBy && (
            <div>
              <label className="text-gray-500 font-medium">Approved By</label>
              <p className="text-gray-900 font-semibold mt-1">{assignment.approvedBy.name}</p>
              <p className="text-gray-600 text-xs">{assignment.approvedBy.role}</p>
            </div>
          )}
          <div>
            <label className="text-gray-500 font-medium">Created At</label>
            <p className="text-gray-900 mt-1">
              {new Date(assignment.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div>
            <label className="text-gray-500 font-medium">Last Updated</label>
            <p className="text-gray-900 mt-1">
              {new Date(assignment.updatedAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
        <button
          onClick={() => navigate('/manager/assignments')}
          className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 font-medium"
        >
          Back to List
        </button>
      </div>
    </div>
  );
}
