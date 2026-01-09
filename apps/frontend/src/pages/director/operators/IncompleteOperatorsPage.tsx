import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  User, 
  MapPin, 
  Shield, 
  CheckCircle, 
  XCircle,
  Edit3,
  Calendar,
  Phone,
  Mail,
  FileWarning
} from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

interface IncompleteOperator {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    state?: string;
    lga?: string;
    profilePhoto?: string;
    isProfileComplete: boolean;
    missingFields: string[];
    status: string;
  };
  employeeId: string;
  locationId?: {
    _id: string;
    locationName: string;
  };
  currentAssignment?: {
    beatId: {
      _id: string;
      beatName: string;
    };
    locationId: {
      _id: string;
      locationName: string;
    };
  };
  missingFieldsLabels: string[];
  approvalStatus: string;
  createdAt: string;
}

export default function IncompleteOperatorsPage() {
  const navigate = useNavigate();
  const [operators, setOperators] = useState<IncompleteOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');

  useEffect(() => {
    fetchIncompleteOperators();
  }, []);

  const fetchIncompleteOperators = async () => {
    try {
      setLoading(true);
      const response = await api.get('/director/operators/incomplete');
      setOperators(response.data.operators || []);
    } catch (error: any) {
      console.error('Error fetching incomplete operators:', error);
      toast.error('Failed to load incomplete operators');
    } finally {
      setLoading(false);
    }
  };

  const filteredOperators = operators.filter(op => {
    if (filter === 'assigned') return op.currentAssignment;
    if (filter === 'unassigned') return !op.currentAssignment;
    return true;
  });

  const getMissingFieldsSeverity = (count: number): { color: string; label: string } => {
    if (count <= 2) return { color: 'yellow', label: 'Low' };
    if (count <= 5) return { color: 'orange', label: 'Medium' };
    return { color: 'red', label: 'High' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading incomplete operators...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-amber-100 rounded-lg">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Incomplete Operator Profiles</h1>
            <p className="text-gray-600">Operators registered with missing information</p>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start">
          <FileWarning className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-amber-800 font-semibold mb-1">Incomplete Registration Warning</h3>
            <p className="text-amber-700 text-sm">
              These operators were registered with missing information. While they can be assigned to BEATs and locations,
              their profiles should be completed as soon as possible for full system functionality.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Incomplete</p>
              <p className="text-2xl font-bold text-amber-600">{operators.length}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-amber-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Assigned</p>
              <p className="text-2xl font-bold text-blue-600">
                {operators.filter(op => op.currentAssignment).length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Unassigned</p>
              <p className="text-2xl font-bold text-red-600">
                {operators.filter(op => !op.currentAssignment).length}
              </p>
            </div>
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">High Priority</p>
              <p className="text-2xl font-bold text-red-600">
                {operators.filter(op => op.missingFieldsLabels.length > 5).length}
              </p>
            </div>
            <FileWarning className="w-10 h-10 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by:</label>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({operators.length})
            </button>
            <button
              onClick={() => setFilter('assigned')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'assigned'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Assigned ({operators.filter(op => op.currentAssignment).length})
            </button>
            <button
              onClick={() => setFilter('unassigned')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unassigned'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unassigned ({operators.filter(op => !op.currentAssignment).length})
            </button>
          </div>
        </div>
      </div>

      {/* Operators List */}
      {filteredOperators.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Incomplete Profiles Found</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'All operator profiles are complete!'
              : `No ${filter} operators with incomplete profiles.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOperators.map((operator) => {
            const severity = getMissingFieldsSeverity(operator.missingFieldsLabels.length);
            
            return (
              <div
                key={operator._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Left: Operator Info */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Profile Photo */}
                    <div className="flex-shrink-0">
                      {operator.userId.profilePhoto ? (
                        <img
                          src={operator.userId.profilePhoto}
                          alt={`${operator.userId.firstName} ${operator.userId.lastName}`}
                          className="w-16 h-16 rounded-full object-cover border-2 border-amber-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center border-2 border-amber-200">
                          <User className="w-8 h-8 text-amber-600" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {operator.userId.firstName} {operator.userId.lastName}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          severity.color === 'red' ? 'bg-red-100 text-red-800' :
                          severity.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {severity.label} Priority
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-gray-400" />
                          <span>ID: {operator.employeeId}</span>
                        </div>
                        {operator.userId.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{operator.userId.email}</span>
                          </div>
                        )}
                        {operator.userId.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{operator.userId.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>Registered: {new Date(operator.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Assignment Status */}
                      {operator.currentAssignment ? (
                        <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 px-3 py-2 rounded-lg mb-3">
                          <MapPin className="w-4 h-4" />
                          <span>
                            Assigned to <strong>{operator.currentAssignment.beatId.beatName}</strong> at{' '}
                            <strong>{operator.currentAssignment.locationId.locationName}</strong>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg mb-3">
                          <XCircle className="w-4 h-4" />
                          <span>Not assigned to any location</span>
                        </div>
                      )}

                      {/* Missing Fields */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-800 mb-1">
                              Missing {operator.missingFieldsLabels.length} field{operator.missingFieldsLabels.length !== 1 ? 's' : ''}:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {operator.missingFieldsLabels.map((field, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full"
                                >
                                  {field}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Button */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => navigate(`/director/operators/edit/${operator.userId._id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Complete Profile</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
