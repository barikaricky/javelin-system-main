import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Shield, ArrowLeft, Edit, MapPin, Building2, Users, Clock, 
  Calendar, CheckCircle, XCircle, User, FileText, AlertCircle,
  TrendingUp, Briefcase, Mail, Phone
} from 'lucide-react';
import axios from 'axios';
import { getApiBaseURL } from '../../../lib/api';

interface Beat {
  _id: string;
  bitName: string;
  bitCode: string;
  locationId: {
    _id: string;
    locationName: string;
    city: string;
    state: string;
  };
  clientId?: {
    _id: string;
    clientName: string;
  };
  supervisorId?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  description?: string;
  securityType: string[];
  numberOfOperators: number;
  shiftType: string;
  startDate?: string;
  endDate?: string;
  specialInstructions?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Assignment {
  _id: string;
  operatorId: {
    _id: string;
    employeeId: string;
    shiftType?: string;
    locationId?: {
      _id: string;
      locationName: string;
    };
    startDate?: string;
    userId: {
      _id: string;
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      phoneNumber?: string;
      profilePhoto?: string;
      passportPhoto?: string;
      state?: string;
      status?: string;
    };
  };
  startDate?: string;
  endDate?: string;
  assignedDate?: string;
  status: string;
}

export const BitDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [bit, setBit] = useState<Beat | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBitDetails();
    fetchAssignments();
  }, [id]);

  const fetchBitDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = getApiBaseURL();
      const response = await axios.get(`${API_URL}/api/beats/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBit(response.data.bit);
    } catch (error) {
      console.error('Error fetching bit details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = getApiBaseURL();
      console.log(`Fetching assignments for BEAT: ${id}`);
      const response = await axios.get(`${API_URL}/api/assignments/beats/${id}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Assignments API Response:', response.data);
      const assignmentsData = response.data.assignments || [];
      console.log('First assignment sample:', assignmentsData[0]);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const getShiftLabel = (shift: string) => {
    const labels: Record<string, string> = {
      'DAY': 'Day Shift',
      'NIGHT': 'Night Shift',
      '24_HOURS': '24 Hours',
      'ROTATING': 'Rotating Shifts'
    };
    return labels[shift] || shift;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'ACTIVE': 'bg-green-100 text-green-700',
      'COMPLETED': 'bg-blue-100 text-blue-700',
      'PENDING': 'bg-yellow-100 text-yellow-700',
      'CANCELLED': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!bit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Beat not found</h3>
          <button
            onClick={() => navigate('/director/beats')}
            className="text-purple-600 hover:text-purple-700"
          >
            Back to Beats
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Animation */}
        <div className="mb-6 animate-fadeIn">
          <button
            onClick={() => navigate('/director/beats')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Beats
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{bit.bitName}</h1>
                  <span className="text-sm text-gray-500 font-mono">{bit.bitCode}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => navigate(`/director/beats/${bit._id}/edit`)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Edit className="h-5 w-5" />
              Edit Beat
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6 animate-slideInLeft">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
            bit.isActive 
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
              : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
          }`}>
            {bit.isActive ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {bit.isActive ? 'Active Beat' : 'Inactive Beat'}
          </span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Required Operators</p>
                <p className="text-3xl font-bold text-gray-900">{bit.numberOfOperators}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Assigned</p>
                <p className="text-3xl font-bold text-gray-900">{assignments.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Shift Type</p>
                <p className="text-lg font-bold text-gray-900">{getShiftLabel(bit.shiftType)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Security Types</p>
                <p className="text-3xl font-bold text-gray-900">{bit.securityType.length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Beat Information - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-md p-6 animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Shield className="h-6 w-6 text-purple-600" />
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <MapPin className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                    <p className="text-base font-semibold text-gray-900">{bit.locationId.locationName}</p>
                    <p className="text-sm text-gray-600">{bit.locationId.city}, {bit.locationId.state}</p>
                  </div>
                </div>

                {bit.clientId && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Briefcase className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 mb-1">Client</p>
                      <p className="text-base font-semibold text-gray-900">{bit.clientId.clientName}</p>
                    </div>
                  </div>
                )}

                {bit.supervisorId && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <User className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 mb-1">Supervisor</p>
                      <p className="text-base font-semibold text-gray-900">
                        {bit.supervisorId.firstName} {bit.supervisorId.lastName}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Clock className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 mb-1">Shift Type</p>
                    <p className="text-base font-semibold text-gray-900">{getShiftLabel(bit.shiftType)}</p>
                  </div>
                </div>
              </div>

              {bit.description && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-start gap-2 mb-2">
                    <FileText className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-semibold text-gray-700">Description</p>
                  </div>
                  <p className="text-gray-900 ml-7">{bit.description}</p>
                </div>
              )}
            </div>

            {/* Security Types & Dates */}
            <div className="bg-white rounded-xl shadow-md p-6 animate-slideInLeft" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-purple-600" />
                Additional Details
              </h2>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600 mb-3">Security Types</p>
                  <div className="flex flex-wrap gap-2">
                    {bit.securityType.map((type, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border border-purple-200"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                {(bit.startDate || bit.endDate) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bit.startDate && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Start Date</p>
                          <p className="text-base font-semibold text-gray-900">
                            {new Date(bit.startDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {bit.endDate && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600 mb-1">End Date</p>
                          <p className="text-base font-semibold text-gray-900">
                            {new Date(bit.endDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {bit.specialInstructions && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-semibold text-yellow-800">Special Instructions</p>
                    </div>
                    <p className="text-gray-900 ml-7">{bit.specialInstructions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assigned Operators - 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 animate-slideInRight" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users className="h-6 w-6 text-purple-600" />
                Assigned Operators ({assignments.length})
              </h2>
              
              {assignments.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No operators assigned yet</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                  {assignments.map((assignment, index) => {
                    // Add null safety checks for nested structure
                    const operator = assignment?.operatorId;
                    const user = operator?.userId;
                    
                    if (!operator || !user) {
                      console.warn('Assignment missing operator/user data:', assignment);
                      return null;
                    }
                    
                    // Use startDate or assignedDate, with fallback
                    const displayDate = assignment.startDate || assignment.assignedDate;
                    const operatorStartDate = operator.startDate;
                    const photoUrl = user.profilePhoto || user.passportPhoto;
                    const phoneDisplay = user.phone || user.phoneNumber;
                    
                    return (
                    <div
                      key={assignment._id}
                      className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all overflow-hidden"
                      style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s both` }}
                    >
                      {/* Header with Status */}
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2 flex items-center justify-between">
                        <span className="text-white text-sm font-semibold">Operator Profile</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)} bg-white`}>
                          {assignment.status}
                        </span>
                      </div>
                      
                      <div className="p-4">
                        {/* Profile Section with Photo */}
                        <div className="flex gap-4 mb-4">
                          {/* Profile Photo */}
                          <div className="flex-shrink-0">
                            {photoUrl ? (
                              <img 
                                src={photoUrl} 
                                alt={`${user.firstName} ${user.lastName}`}
                                className="w-20 h-20 rounded-lg object-cover border-2 border-purple-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=9333ea&color=fff&size=80`;
                                }}
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                              </div>
                            )}
                          </div>
                          
                          {/* Basic Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {user.firstName || 'N/A'} {user.lastName || ''}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-mono font-semibold">
                                {operator.employeeId || 'N/A'}
                              </span>
                              {user.status && (
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                  user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {user.status}
                                </span>
                              )}
                            </div>
                            {user.state && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>{user.state}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Contact Information */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
                          <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Contact Information</h4>
                          {user.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-purple-600 flex-shrink-0" />
                              <span className="text-gray-700 break-all">{user.email}</span>
                            </div>
                          )}
                          {phoneDisplay && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-purple-600 flex-shrink-0" />
                              <span className="text-gray-700">{phoneDisplay}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Work Details */}
                        <div className="grid grid-cols-2 gap-3">
                          {operator.shiftType && (
                            <div className="bg-blue-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="text-xs text-gray-600">Shift Type</span>
                              </div>
                              <p className="text-sm font-semibold text-gray-900">
                                {operator.shiftType.replace('_', ' ')}
                              </p>
                            </div>
                          )}
                          
                          {operatorStartDate && (
                            <div className="bg-green-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-4 w-4 text-green-600" />
                                <span className="text-xs text-gray-600">Start Date</span>
                              </div>
                              <p className="text-sm font-semibold text-gray-900">
                                {new Date(operatorStartDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          )}
                          
                          {displayDate && (
                            <div className="bg-purple-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-4 w-4 text-purple-600" />
                                <span className="text-xs text-gray-600">Assignment Date</span>
                              </div>
                              <p className="text-sm font-semibold text-gray-900">
                                {new Date(displayDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          )}
                          
                          {operator.locationId && (
                            <div className="bg-orange-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 className="h-4 w-4 text-orange-600" />
                                <span className="text-xs text-gray-600">Location</span>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 truncate" title={operator.locationId.locationName}>
                                {operator.locationId.locationName}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out;
        }

        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #a855f7;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9333ea;
        }
      `}</style>
    </div>
  );
};
