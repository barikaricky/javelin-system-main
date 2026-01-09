import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Calendar, MapPin, Grid3x3, User, AlertCircle, RefreshCw } from 'lucide-react';
import { api, getImageUrl } from '../../../lib/api';
import toast from 'react-hot-toast';

interface Assignment {
  _id: string;
  operatorId: {
    _id: string;
    employeeId: string;
    userId: {
      firstName: string;
      lastName: string;
      email: string;
      profilePhoto?: string;
      passportPhoto?: string;
    };
  };
  locationId: {
    _id: string;
    locationName: string;
    city: string;
    state: string;
  };
  beatId: {
    _id: string;
    beatName: string;
    beatCode: string;
  };
  supervisorId: {
    _id: string;
    userId?: {
      firstName: string;
      lastName: string;
    };
  };
  shiftType: string;
  assignmentType: string;
  startDate: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PendingAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPendingAssignments();
  }, []);

  const fetchPendingAssignments = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch assignments with PENDING status for current supervisor
      const response = await api.get('/assignments', {
        params: { status: 'PENDING' }
      });

      console.log('📋 Pending assignments response:', response.data);

      const allAssignments = response.data.assignments || response.data.data || [];
      
      // Filter to only show assignments created by the logged-in supervisor
      // The backend will automatically filter by supervisor based on authentication
      setAssignments(allAssignments);

      if (showRefreshToast) {
        toast.success('Assignments refreshed');
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch pending assignments:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch pending assignments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchPendingAssignments(true);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: Clock,
        label: 'Pending Approval',
      },
      ACTIVE: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: CheckCircle,
        label: 'Approved',
      },
      REJECTED: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: XCircle,
        label: 'Rejected',
      },
    };

    const badge = badges[status as keyof typeof badges];
    if (!badge) return null;

    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="h-3.5 w-3.5" />
        {badge.label}
      </span>
    );
  };

  const getShiftTypeBadge = (shiftType: string) => {
    const badges = {
      DAY: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Day Shift' },
      NIGHT: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Night Shift' },
      ROTATING: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Rotating' },
    };

    const badge = badges[shiftType as keyof typeof badges] || {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      label: shiftType,
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-600" />
              Pending Assignments
            </h1>
            <p className="text-gray-600 mt-2">
              Track your assignment requests awaiting General Supervisor approval
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Approval Process</p>
              <p className="text-sm text-blue-800 mt-1">
                All assignment requests require approval from the General Supervisor before becoming active.
                You'll be notified once your requests are reviewed.
              </p>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        {assignments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Assignments</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              You don't have any assignment requests pending approval at the moment.
              All your assignment requests have been processed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const operatorName = assignment.operatorId?.userId
                ? `${assignment.operatorId.userId.firstName} ${assignment.operatorId.userId.lastName}`
                : 'Unknown Operator';
              const operatorPhoto = assignment.operatorId?.userId?.profilePhoto || assignment.operatorId?.userId?.passportPhoto;

              return (
                <div
                  key={assignment._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    {/* Header with Status */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusBadge(assignment.status)}
                          <span className="text-xs text-gray-500">
                            Submitted {getTimeAgo(assignment.createdAt)}
                          </span>
                        </div>
                      </div>
                      {getShiftTypeBadge(assignment.shiftType)}
                    </div>

                    {/* Main Content - Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Operator Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                          <User className="h-4 w-4" />
                          Operator
                        </div>
                        <div className="flex items-center gap-3">
                          {operatorPhoto ? (
                            <img
                              src={getImageUrl(operatorPhoto)}
                              alt={operatorName}
                              className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                              <User className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{operatorName}</p>
                            <p className="text-sm text-gray-600">ID: {assignment.operatorId?.employeeId}</p>
                          </div>
                        </div>
                      </div>

                      {/* Location Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                          <MapPin className="h-4 w-4" />
                          Location
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {assignment.locationId?.locationName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {assignment.locationId?.city}, {assignment.locationId?.state}
                          </p>
                        </div>
                      </div>

                      {/* Beat Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                          <Grid3x3 className="h-4 w-4" />
                          Beat Assignment
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {assignment.beatId?.beatName}
                          </p>
                          <p className="text-sm text-gray-600">
                            Code: {assignment.beatId?.beatCode}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          Start Date: <span className="font-medium text-gray-900">{formatDate(assignment.startDate)}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">
                          Type: <span className="font-medium text-gray-900 capitalize">{assignment.assignmentType.toLowerCase()}</span>
                        </span>
                      </div>
                    </div>

                    {/* Rejection Reason (if applicable) */}
                    {assignment.status === 'REJECTED' && assignment.rejectionReason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-semibold text-red-900 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-800">{assignment.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Footer */}
        {assignments.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Total Pending Requests: <span className="font-semibold text-gray-900">{assignments.length}</span>
              </span>
              <span className="text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
