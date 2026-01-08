import { useState, useEffect } from 'react';
import { Users, Search, MapPin, Clock, Mail, Phone, Loader2, UserCheck, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';

interface Operator {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  employeeId: string;
  userId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    passportPhoto?: string;
  };
  supervisorId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    employeeId: string;
    userId?: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      passportPhoto?: string;
    };
  };
  locationId?: {
    _id: string;
    locationName: string;
  };
  shiftType: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  passportPhoto?: string;
  createdAt: string;
}

export default function OperatorsListPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const response = await api.get('/operators/all');
      
      let operatorsData: Operator[] = [];
      if (Array.isArray(response.data)) {
        operatorsData = response.data;
      } else if (response.data.operators) {
        operatorsData = response.data.operators;
      } else if (response.data.data) {
        operatorsData = response.data.data;
      }
      
      console.log('Fetched all operators:', operatorsData.length);
      setOperators(operatorsData);
    } catch (error: any) {
      console.error('Error fetching operators:', error);
      toast.error(error.response?.data?.message || 'Failed to load operators');
    } finally {
      setLoading(false);
    }
  };

  const getOperatorInfo = (operator: Operator) => {
    return {
      firstName: operator.firstName || operator.userId?.firstName || 'N/A',
      lastName: operator.lastName || operator.userId?.lastName || '',
      email: operator.email || operator.userId?.email || 'No email',
      phone: operator.phone || operator.userId?.phone || 'No phone',
      photo: operator.passportPhoto || operator.userId?.passportPhoto,
      supervisor: operator.supervisorId?.userId
        ? `${operator.supervisorId.userId.firstName} ${operator.supervisorId.userId.lastName}` 
        : operator.supervisorId
        ? `${operator.supervisorId.firstName || ''} ${operator.supervisorId.lastName || ''}`.trim() || 'Unnamed Supervisor'
        : 'Unassigned',
      supervisorId: operator.supervisorId?._id || 'unassigned',
      supervisorEmployeeId: operator.supervisorId?.employeeId || 'N/A',
      supervisorPhoto: operator.supervisorId?.userId?.passportPhoto,
      location: operator.locationId?.locationName || 'No location',
      locationId: operator.locationId?._id || 'no-location',
    };
  };

  // Filter operators first
  const filteredOperators = operators.filter((op) => {
    const info = getOperatorInfo(op);
    const searchString = `${info.firstName} ${info.lastName} ${info.email} ${op.employeeId} ${info.supervisor} ${info.location}`
      .toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  // Group operators by supervisor and location
  const groupedBySupervisor = filteredOperators.reduce((acc, operator) => {
    const info = getOperatorInfo(operator);
    const supervisorKey = info.supervisorId;
    
    if (!acc[supervisorKey]) {
      acc[supervisorKey] = {
        supervisorName: info.supervisor,
        supervisorEmployeeId: info.supervisorEmployeeId,
        supervisorPhoto: info.supervisorPhoto,
        operators: [],
      };
    }
    
    acc[supervisorKey].operators.push(operator);
    return acc;
  }, {} as Record<string, { supervisorName: string; supervisorEmployeeId: string; supervisorPhoto?: string; operators: Operator[] }>);

  // Sort supervisor groups - unassigned last
  const sortedSupervisorGroups = Object.entries(groupedBySupervisor).sort(([keyA], [keyB]) => {
    if (keyA === 'unassigned') return 1;
    if (keyB === 'unassigned') return -1;
    return 0;
  });

  const stats = {
    total: operators.length,
    pending: operators.filter(o => o.approvalStatus === 'PENDING').length,
    approved: operators.filter(o => o.approvalStatus === 'APPROVED').length,
    rejected: operators.filter(o => o.approvalStatus === 'REJECTED').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading all operators...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Operators</h1>
          <p className="text-gray-600">View all operators with their supervisor and location details</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Approved</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, employee ID, supervisor, or location..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Operators Grouped by Supervisor */}
        {filteredOperators.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Operators Found</h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'No operators match your search criteria'
                  : 'No operators have been registered yet'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedSupervisorGroups.map(([supervisorId, group]) => {
              // Group operators by location within this supervisor
              const operatorsByLocation = group.operators.reduce((acc, operator) => {
                const info = getOperatorInfo(operator);
                const locationKey = info.locationId;
                
                if (!acc[locationKey]) {
                  acc[locationKey] = {
                    locationName: info.location,
                    operators: [],
                  };
                }
                
                acc[locationKey].operators.push(operator);
                return acc;
              }, {} as Record<string, { locationName: string; operators: Operator[] }>);

              return (
                <div key={supervisorId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Supervisor Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5">
                    <div className="flex items-center gap-3">
                      {group.supervisorPhoto ? (
                        <img
                          src={group.supervisorPhoto}
                          alt={group.supervisorName}
                          className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/50">
                          <UserCheck className="w-7 h-7 text-white" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          {group.supervisorName}
                        </h2>
                        <p className="text-blue-100 text-sm">
                          Employee ID: {group.supervisorEmployeeId} • {group.operators.length} Operator{group.operators.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Operators grouped by location */}
                  <div className="p-5">
                    {Object.entries(operatorsByLocation).map(([locationId, locationGroup]) => (
                      <div key={locationId} className="mb-6 last:mb-0">
                        {/* Location Header */}
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                          <MapPin className="w-5 h-5 text-red-500" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {locationGroup.locationName}
                          </h3>
                          <span className="ml-auto text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                            {locationGroup.operators.length} operator{locationGroup.operators.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Operators Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {locationGroup.operators.map((operator) => {
                            const info = getOperatorInfo(operator);
                            
                            return (
                              <div
                                key={operator._id}
                                className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md hover:bg-white transition-all"
                              >
                                {/* Operator Header */}
                                <div className="flex items-start gap-3 mb-3">
                                  {info.photo ? (
                                    <img
                                      src={info.photo}
                                      alt={`${info.firstName} ${info.lastName}`}
                                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                                      {info.firstName.charAt(0)}{info.lastName.charAt(0)}
                                    </div>
                                  )}
                                  
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 truncate text-sm">
                                      {info.firstName} {info.lastName}
                                    </h4>
                                    <p className="text-xs text-gray-600 truncate">{operator.employeeId}</p>
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded text-xs font-medium ${
                                        operator.approvalStatus === 'APPROVED'
                                          ? 'bg-green-100 text-green-800'
                                          : operator.approvalStatus === 'REJECTED'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}
                                    >
                                      {operator.approvalStatus === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                                      {operator.approvalStatus === 'REJECTED' && <XCircle className="w-3 h-3" />}
                                      {operator.approvalStatus === 'PENDING' && <Clock className="w-3 h-3" />}
                                      {operator.approvalStatus}
                                    </span>
                                  </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-2 text-xs">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{info.email}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    <span>{info.phone}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    <span className="capitalize">{operator.shiftType?.toLowerCase() || 'N/A'} Shift</span>
                                  </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs text-gray-500">
                                    Registered {new Date(operator.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
