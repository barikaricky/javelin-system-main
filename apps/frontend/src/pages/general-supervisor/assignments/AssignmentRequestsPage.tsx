import { useState, useEffect } from 'react';
import { api, getImageUrl } from '../../../lib/api';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MapPin,
  Building2,
  Calendar,
  AlertCircle,
  User,
  Shield,
  Briefcase,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      phone?: string;
      phoneNumber?: string;
      profilePhoto?: string;
      state?: string;
    };
  };
  beatId: {
    _id: string;
    beatCode: string;
    beatName: string;
    numberOfOperators?: number;
  };
  locationId: {
    _id: string;
    locationName: string;
    city: string;
    state: string;
    address: string;
  };
  supervisorId: {
    _id: string;
    fullName: string;
    supervisorType: string;
    userId: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  shiftType: string;
  startDate: string;
  assignmentType: string;
  status: string;
  specialInstructions?: string;
  assignedBy: {
    userId: string;
    role: string;
    name: string;
  };
  createdAt: string;
}

export default function AssignmentRequestsPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    fetchPendingAssignments();
  }, []);

  const fetchPendingAssignments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/assignments/pending');
      setAssignments(response.data.assignments || []);
    } catch (error: any) {
      console.error('Error fetching pending assignments:', error);
      toast.error('Failed to load pending assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (assignmentId: string) => {
    try {
      setProcessingId(assignmentId);
      await api.patch(`/assignments/${assignmentId}/approve`);
      toast.success('Assignment approved successfully');
      
      // Remove from list
      setAssignments(prev => prev.filter(a => a._id !== assignmentId));
      setSelectedAssignment(null);
    } catch (error: any) {
      console.error('Error approving assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to approve assignment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (assignmentId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      setProcessingId(assignmentId);
      await api.patch(`/assignments/${assignmentId}/reject`, { reason });
      toast.success('Assignment rejected');
      
      // Remove from list
      setAssignments(prev => prev.filter(a => a._id !== assignmentId));
      setSelectedAssignment(null);
    } catch (error: any) {
      console.error('Error rejecting assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to reject assignment');
    } finally {
      setProcessingId(null);
    }
  };

  const getShiftTypeLabel = (shift: string) => {
    const labels: Record<string, string> = {
      DAY: 'Day Shift',
      NIGHT: 'Night Shift',
      '24_HOURS': '24 Hours',
      ROTATING: 'Rotating',
    };
    return labels[shift] || shift;
  };

  const getAssignmentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PERMANENT: 'Permanent',
      TEMPORARY: 'Temporary',
      RELIEF: 'Relief',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignment requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/general-supervisor/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-600" />
            Assignment Requests
          </h1>
          <p className="text-gray-600 mt-2">
            Review and approve assignment requests from supervisors
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              </div>
              <Clock className="h-10 w-10 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Assignment Requests List */}
        {assignments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">There are no pending assignment requests at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* List View */}
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const operatorName = `${assignment.operatorId.userId.firstName} ${assignment.operatorId.userId.lastName}`;
                const supervisorName = assignment.supervisorId.fullName;
                const isSelected = selectedAssignment?._id === assignment._id;

                return (
                  <div
                    key={assignment._id}
                    onClick={() => setSelectedAssignment(assignment)}
                    className={`bg-white rounded-lg shadow-sm border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {assignment.operatorId.userId.profilePhoto ? (
                          <img
                            src={getImageUrl(assignment.operatorId.userId.profilePhoto)}
                            alt={operatorName}
                            className="h-12 w-12 rounded-full object-cover border-2 border-gray-300"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center border-2 border-gray-300">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{operatorName}</h3>
                          <p className="text-sm text-gray-600">ID: {assignment.operatorId.employeeId}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                        Pending
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{assignment.beatId.beatName}</span>
                        <span className="text-gray-500">({assignment.beatId.beatCode})</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{assignment.locationId.locationName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span>Supervisor: {supervisorName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Start: {new Date(assignment.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(assignment._id);
                        }}
                        disabled={processingId === assignment._id}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        {processingId === assignment._id ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(assignment._id);
                        }}
                        disabled={processingId === assignment._id}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail View */}
            {selectedAssignment && (
              <div className="lg:sticky lg:top-6 h-fit">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Assignment Details</h2>

                  {/* Operator Info */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Operator Information
                    </h3>
                    <div className="flex items-center gap-4 mb-4">
                      {selectedAssignment.operatorId.userId.profilePhoto ? (
                        <img
                          src={getImageUrl(selectedAssignment.operatorId.userId.profilePhoto)}
                          alt="Operator"
                          className="h-16 w-16 rounded-full object-cover border-2 border-gray-300"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center border-2 border-gray-300">
                          <User className="h-8 w-8 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">
                          {selectedAssignment.operatorId.userId.firstName}{' '}
                          {selectedAssignment.operatorId.userId.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          ID: {selectedAssignment.operatorId.employeeId}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="text-gray-900">{selectedAssignment.operatorId.userId.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="text-gray-900">
                          {selectedAssignment.operatorId.userId.phone || 
                           selectedAssignment.operatorId.userId.phoneNumber || 
                           'N/A'}
                        </span>
                      </div>
                      {selectedAssignment.operatorId.userId.state && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">State:</span>
                          <span className="text-gray-900">{selectedAssignment.operatorId.userId.state}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assignment Location */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Assignment Location
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Location</p>
                        <p className="font-medium text-gray-900">{selectedAssignment.locationId.locationName}</p>
                        <p className="text-sm text-gray-600">
                          {selectedAssignment.locationId.address}, {selectedAssignment.locationId.city},{' '}
                          {selectedAssignment.locationId.state}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">BEAT</p>
                        <p className="font-medium text-gray-900">{selectedAssignment.beatId.beatName}</p>
                        <p className="text-sm text-gray-600">Code: {selectedAssignment.beatId.beatCode}</p>
                        {selectedAssignment.beatId.numberOfOperators && (
                          <p className="text-sm text-gray-600">
                            Required Guards: {selectedAssignment.beatId.numberOfOperators}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Supervisor Info */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Supervisor
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="text-gray-900 font-medium">
                          {selectedAssignment.supervisorId.fullName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="text-gray-900">
                          {selectedAssignment.supervisorId.supervisorType.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="text-gray-900 text-xs">
                          {selectedAssignment.supervisorId.userId.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assignment Details */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Assignment Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shift Type:</span>
                        <span className="text-gray-900 font-medium">
                          {getShiftTypeLabel(selectedAssignment.shiftType)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assignment Type:</span>
                        <span className="text-gray-900 font-medium">
                          {getAssignmentTypeLabel(selectedAssignment.assignmentType)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start Date:</span>
                        <span className="text-gray-900 font-medium">
                          {new Date(selectedAssignment.startDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Requested By:</span>
                        <span className="text-gray-900">{selectedAssignment.assignedBy.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Requested On:</span>
                        <span className="text-gray-900">
                          {new Date(selectedAssignment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {selectedAssignment.specialInstructions && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Special Instructions</p>
                        <p className="text-sm text-blue-800">{selectedAssignment.specialInstructions}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleApprove(selectedAssignment._id)}
                      disabled={processingId === selectedAssignment._id}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      {processingId === selectedAssignment._id ? (
                        <>
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(selectedAssignment._id)}
                      disabled={processingId === selectedAssignment._id}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <XCircle className="h-5 w-5" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
