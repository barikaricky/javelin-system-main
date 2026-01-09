import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Users,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
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

export default function AssignmentsListPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/assignments');
      setAssignments(response.data.assignments || []);
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      ACTIVE: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Active' },
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
      ENDED: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle, label: 'Ended' },
      TRANSFERRED: { color: 'bg-blue-100 text-blue-800', icon: MapPin, label: 'Transferred' },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.operatorId.userId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.operatorId.userId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.beatId.beatName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.beatId.beatCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || assignment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: assignments.length,
    active: assignments.filter((a) => a.status === 'ACTIVE').length,
    pending: assignments.filter((a) => a.status === 'PENDING').length,
    ended: assignments.filter((a) => a.status === 'ENDED').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <Clock className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse mx-auto"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 animate-slide-in-top">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Guard Assignments
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Manage security personnel deployments to BEATs</p>
        </div>
        <button
          onClick={() => navigate('/manager/assignments/assign')}
          className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl w-full md:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          Assign Guard
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 animate-slide-in-bottom">
        {[
          { label: 'Total Assignments', value: stats.total, icon: Users, color: 'blue', gradient: 'from-blue-500 to-blue-600' },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: 'green', gradient: 'from-green-500 to-green-600' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'yellow', gradient: 'from-yellow-500 to-yellow-600' },
          { label: 'Ended', value: stats.ended, icon: AlertTriangle, color: 'gray', gradient: 'from-gray-500 to-gray-600' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-md hover:shadow-xl p-4 md:p-5 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs md:text-sm font-medium">{stat.label}</p>
                  <p className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mt-1`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`bg-gradient-to-br ${stat.gradient} p-2 md:p-3 rounded-lg shadow-lg`}>
                  <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6 animate-slide-in-left">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by guard name, BEAT name, or BEAT code..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="ENDED">Ended</option>
              <option value="TRANSFERRED">Transferred</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={fetchAssignments}
            disabled={refreshing}
            className="flex items-center px-4 py-2 text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            <RefreshCw className={`w-5 h-5 mr-2 transition-transform ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 md:p-12 text-center animate-fade-in">
          <div className="inline-block p-4 bg-gray-100 rounded-full mb-4 animate-bounce">
            <Users className="w-16 h-16 text-gray-400" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">No assignments found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Start by assigning guards to BEATs'}
          </p>
          {!searchTerm && statusFilter === 'ALL' && (
            <button
              onClick={() => navigate('/manager/assignments/assign')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Assign First Guard
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="block lg:hidden space-y-4 animate-slide-in-right">
            {filteredAssignments.map((assignment, index) => (
              <div
                key={assignment._id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl p-4 transition-all duration-300 transform hover:-translate-y-1 animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 overflow-hidden mr-3 shadow-md">
                      {assignment.operatorId.userId.profilePhoto ? (
                        <img
                          src={assignment.operatorId.userId.profilePhoto}
                          alt={assignment.operatorId.userId.firstName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-full h-full p-2 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {assignment.operatorId.userId.firstName} {assignment.operatorId.userId.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{assignment.operatorId.employeeId}</p>
                    </div>
                  </div>
                  {getStatusBadge(assignment.status)}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="font-medium">{assignment.beatId.beatName}</span>
                    <span className="text-gray-500 ml-1">({assignment.beatId.beatCode})</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-4 h-4 mr-2 text-green-600" />
                    <span>{assignment.locationId.name}, {assignment.locationId.state}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-orange-600" />
                      <span>{assignment.shiftType.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                      <span>{new Date(assignment.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate(`/manager/assignments/${assignment._id}`)}
                  className="mt-4 w-full py-2 text-center text-blue-600 font-medium border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-300"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-xl shadow-md overflow-hidden animate-slide-in-right">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    {['Guard', 'BEAT', 'Location', 'Shift', 'Start Date', 'Status', 'Actions'].map((header) => (
                      <th
                        key={header}
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAssignments.map((assignment, index) => (
                    <tr
                      key={assignment._id}
                      className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-300 animate-fade-in-row"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 overflow-hidden mr-3 shadow-md">
                            {assignment.operatorId.userId.profilePhoto ? (
                              <img
                                src={assignment.operatorId.userId.profilePhoto}
                                alt={assignment.operatorId.userId.firstName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Users className="w-full h-full p-2 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {assignment.operatorId.userId.firstName} {assignment.operatorId.userId.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{assignment.operatorId.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{assignment.beatId.beatName}</p>
                        <p className="text-xs text-gray-500">{assignment.beatId.beatCode}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{assignment.locationId.name}</p>
                        <p className="text-xs text-gray-500">{assignment.locationId.state}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{assignment.shiftType.replace('_', ' ')}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {new Date(assignment.startDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(assignment.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => navigate(`/manager/assignments/${assignment._id}`)}
                          className="text-blue-600 hover:text-blue-900 font-medium transition-colors duration-300"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
