import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import {
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Building2,
  MapPin,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface Assignment {
  _id: string;
  operatorId: {
    _id: string;
    employeeId: string;
    userId: {
      firstName: string;
      lastName: string;
      phone: string;
      profilePhoto?: string;
    };
  };
  beatId: {
    _id: string;
    beatCode: string;
    beatName: string;
  };
  locationId: {
    _id: string;
    name: string;
    state: string;
  };
  supervisorId: {
    _id: string;
    userId: {
      firstName: string;
      lastName: string;
    };
  };
  shiftType: string;
  startDate: string;
  status: string;
  assignedBy: {
    name: string;
    role: string;
  };
  createdAt: string;
}

export default function AssignmentApprovalsPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ show: boolean; assignmentId: string | null }>({
    show: false,
    assignmentId: null,
  });
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingAssignments();
  }, []);

  const fetchPendingAssignments = async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/assignments/pending');
      setAssignments(response.data.assignments || []);
    } catch (error: any) {
      console.error('Error fetching pending assignments:', error);
      toast.error('Failed to load pending assignments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (assignmentId: string) => {
    setProcessingId(assignmentId);
    try {
      await api.patch(`/assignments/${assignmentId}/approve`);
      toast.success('Assignment approved successfully');
      fetchPendingAssignments();
    } catch (error: any) {
      console.error('Error approving assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to approve assignment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.assignmentId || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessingId(rejectModal.assignmentId);
    try {
      await api.patch(`/assignments/${rejectModal.assignmentId}/reject`, {
        rejectionReason,
      });
      toast.success('Assignment rejected');
      setRejectModal({ show: false, assignmentId: null });
      setRejectionReason('');
      fetchPendingAssignments();
    } catch (error: any) {
      console.error('Error rejecting assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to reject assignment');
    } finally {
      setProcessingId(null);
    }
  };

  const stats = {
    pending: assignments.length,
    todayPending: assignments.filter(
      (a) => new Date(a.createdAt).toDateString() === new Date().toDateString()
    ).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Clock className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading pending assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Assignment Approvals</h1>
          <p className="text-gray-600 mt-1">Review and approve operator assignments</p>
        </div>
        <button
          onClick={fetchPendingAssignments}
          disabled={refreshing}
          className="flex items-center px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Assignments</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Submitted Today</p>
              <p className="text-2xl font-bold text-blue-600">{stats.todayPending}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Awaiting Your Action</p>
              <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No pending assignments</h3>
          <p className="text-gray-600">All assignments have been reviewed</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {assignments.map((assignment) => (
            <div key={assignment._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-white">
                    <Clock className="w-5 h-5 mr-2" />
                    <span className="font-medium">Pending Approval</span>
                  </div>
                  <span className="text-xs text-white bg-white bg-opacity-20 px-2 py-1 rounded">
                    {new Date(assignment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                {/* Operator Info */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Operator</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mr-3">
                      {assignment.operatorId.userId.profilePhoto ? (
                        <img
                          src={assignment.operatorId.userId.profilePhoto}
                          alt={assignment.operatorId.userId.firstName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-full h-full p-3 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {assignment.operatorId.userId.firstName}{' '}
                        {assignment.operatorId.userId.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{assignment.operatorId.employeeId}</p>
                      <p className="text-xs text-gray-500">{assignment.operatorId.userId.phone}</p>
                    </div>
                  </div>
                </div>

                {/* BEAT Info */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Assigned to BEAT</p>
                  <div className="flex items-start">
                    <Building2 className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">{assignment.beatId.beatName}</p>
                      <p className="text-sm text-gray-600">{assignment.beatId.beatCode}</p>
                    </div>
                  </div>
                </div>

                {/* Location Info */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Location</p>
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">{assignment.locationId.name}</p>
                      <p className="text-sm text-gray-600">{assignment.locationId.state}</p>
                    </div>
                  </div>
                </div>

                {/* Assignment Details */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Shift Type</p>
                    <p className="font-medium text-gray-800">
                      {assignment.shiftType.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="font-medium text-gray-800">
                      {new Date(assignment.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Requested By</p>
                    <p className="font-medium text-gray-800">
                      {assignment.assignedBy.name} ({assignment.assignedBy.role})
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                <button
                  onClick={() =>
                    setRejectModal({ show: true, assignmentId: assignment._id })
                  }
                  disabled={processingId === assignment._id}
                  className="flex items-center px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(assignment._id)}
                  disabled={processingId === assignment._id}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {processingId === assignment._id ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Reject Assignment</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this assignment:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              placeholder="Enter rejection reason..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-4"
              required
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setRejectModal({ show: false, assignmentId: null });
                  setRejectionReason('');
                }}
                disabled={processingId !== null}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processingId !== null || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {processingId ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
