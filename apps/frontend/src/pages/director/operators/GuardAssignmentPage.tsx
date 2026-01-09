import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getImageUrl } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import { User } from 'lucide-react';

interface Operator {
  _id: string;
  employeeId?: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    profilePhoto?: string;
    firstName?: string;
    lastName?: string;
  };
  locationId?: {
    _id: string;
    locationName: string;
  };
  shiftType?: string;
  status: string;
  currentAssignment?: GuardAssignment;
}

interface GuardAssignment {
  _id: string;
  operatorId: string;
  beatId: {
    _id: string;
    beatName: string;
    beatCode: string;
  };
  locationId: {
    _id: string;
    locationName: string;
  };
  supervisorId: {
    _id: string;
    userId: {
      name: string;
    };
  };
  status: string;
  assignmentType: string;
  shiftType: string;
  startDate: string;
}

interface Location {
  _id: string;
  locationName: string;
  locationCode: string;
}

interface Beat {
  _id: string;
  beatName: string;
  beatCode: string;
  locationId: string | { _id: string; locationName: string };
  numberOfOperators: number;
}

interface Supervisor {
  _id: string;
  fullName: string;
  supervisorType: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  locationId: string | { _id: string; locationName: string };
}

const GuardAssignmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [beats, setBits] = useState<Beat[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Assignment form state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    operatorId: '',
    locationId: '',
    beatId: '',
    supervisorId: '',
    shiftType: 'DAY',
    assignmentType: 'PERMANENT',
    startDate: new Date().toISOString().split('T')[0]
  });

  // Filter states
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch operators with their current assignments
      console.log('🔄 DIRECTOR: Starting data fetch...');
      
      const [operatorsRes, locationsRes, bitsRes, supervisorsRes] = await Promise.all([
        api.get('/director/operators?includeAssignments=true'),
        api.get('/locations?isActive=true&limit=500'),
        api.get('/beats?isActive=all&limit=500'),
        api.get('/director/supervisors?approvalStatus=APPROVED&limit=500')
      ]);

      console.log('📦 DIRECTOR: Raw API responses:');
      console.log('  - Operators:', operatorsRes.data);
      console.log('  - Operators array:', operatorsRes.data.operators);
      console.log('  - Operators count:', operatorsRes.data.operators?.length);
      console.log('  - First operator full object:', JSON.stringify(operatorsRes.data.operators[0], null, 2));
      console.log('  - Locations:', locationsRes.data);
      console.log('  - Beats:', bitsRes.data);
      console.log('  - Supervisors RAW:', supervisorsRes);
      console.log('  - Supervisors DATA:', supervisorsRes.data);
      
      // Filter out any null or invalid operators
      const validOperators = (operatorsRes.data.operators || []).filter(
        (op: any) => {
          const isValid = op && op.userId;
          if (!isValid) {
            console.warn('⚠️ Skipping invalid operator:', op);
          }
          return isValid;
        }
      );
      console.log('✅ Valid operators after filtering:', validOperators.length);
      setOperators(validOperators);
      
      setLocations(locationsRes.data.locations || []);
      setBits(bitsRes.data.beats || []);
      
      const supervisorsData = supervisorsRes.data.supervisors || supervisorsRes.data || [];
      console.log('👮 DIRECTOR: Supervisor processing:');
      console.log('  - Raw supervisors:', supervisorsData);
      console.log('  - Count:', supervisorsData.length);
      console.log('  - First item:', supervisorsData[0]);
      console.log('  - Is Array?', Array.isArray(supervisorsData));
      
      setSupervisors(supervisorsData);
      console.log('✅ DIRECTOR: Supervisors set to state');
      
      console.log('✅ Data fetched:', {
        operators: operatorsRes.data.operators?.length || 0,
        locations: locationsRes.data.locations?.length || 0,
        beats: bitsRes.data.beats?.length || 0,
        supervisors: supervisorsData.length,
      });
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (operator?: Operator) => {
    if (operator) {
      setSelectedOperator(operator);
      
      // Pre-fill form if operator has existing assignment
      if (operator.currentAssignment) {
        setAssignmentForm({
          operatorId: operator._id,
          locationId: operator.currentAssignment.locationId?._id || '',
          beatId: operator.currentAssignment.beatId?._id || '',
          supervisorId: operator.currentAssignment.supervisorId?._id || '',
          shiftType: operator.currentAssignment.shiftType,
          assignmentType: operator.currentAssignment.assignmentType,
          startDate: operator.currentAssignment.startDate ? operator.currentAssignment.startDate.split('T')[0] : new Date().toISOString().split('T')[0]
        });
      } else if (operator.locationId) {
        setAssignmentForm({
          operatorId: operator._id,
          locationId: operator.locationId?._id || '',
          beatId: '',
          supervisorId: '',
          shiftType: 'DAY',
          assignmentType: 'PERMANENT',
          startDate: new Date().toISOString().split('T')[0]
        });
      } else {
        setAssignmentForm({
          operatorId: operator._id,
          locationId: '',
          beatId: '',
          supervisorId: '',
          shiftType: 'DAY',
          assignmentType: 'PERMANENT',
          startDate: new Date().toISOString().split('T')[0]
        });
      }
    } else {
      // Open modal without pre-selection
      setSelectedOperator(null);
      setAssignmentForm({
        operatorId: '',
        locationId: '',
        beatId: '',
        supervisorId: '',
        shiftType: 'DAY',
        assignmentType: 'PERMANENT',
        startDate: new Date().toISOString().split('T')[0]
      });
    }
    
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedOperator(null);
    setAssignmentForm({
      operatorId: '',
      locationId: '',
      beatId: '',
      supervisorId: '',
      shiftType: 'DAY',
      assignmentType: 'PERMANENT',
      startDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!assignmentForm.operatorId || !assignmentForm.locationId || !assignmentForm.beatId || !assignmentForm.supervisorId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        operatorId: assignmentForm.operatorId,
        beatId: assignmentForm.beatId,
        supervisorId: assignmentForm.supervisorId,
        shiftType: assignmentForm.shiftType,
        assignmentType: assignmentForm.assignmentType,
        startDate: assignmentForm.startDate
      };

      const operator = operators.find(op => op._id === assignmentForm.operatorId);
      
      if (operator?.currentAssignment) {
        // Update existing assignment
        await api.put(`/assignments/${operator.currentAssignment._id}`, payload);
        toast.success('Assignment updated successfully');
      } else {
        // Create new assignment (locationId comes from BEAT automatically)
        await api.post('/assignments/assign', payload);
        toast.success('Guard assigned successfully');
      }

      closeAssignModal();
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error saving assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to save assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassign = async (operatorId: string, assignmentId: string) => {
    if (!confirm('Are you sure you want to unassign this guard?')) return;

    try {
      await api.delete(`/assignments/${assignmentId}`);
      toast.success('Guard unassigned successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error unassigning guard:', error);
      toast.error(error.response?.data?.message || 'Failed to unassign guard');
    }
  };

  // Filter beats based on selected location
  const filteredBits = assignmentForm.locationId
    ? beats.filter(bit => {
        if (!bit.locationId) return false;
        const bitLocationId = typeof bit.locationId === 'string' ? bit.locationId : bit.locationId._id;
        return bitLocationId === assignmentForm.locationId;
      })
    : beats;

  // Filter supervisors based on selected location
  const filteredSupervisors = assignmentForm.locationId
    ? supervisors.filter(sup => {
        if (!sup.locationId) return false;
        const supLocationId = typeof sup.locationId === 'string' ? sup.locationId : sup.locationId._id;
        return supLocationId === assignmentForm.locationId;
      })
    : supervisors; // Show ALL supervisors when no location selected (including those without location)

  // Debug logging
  console.log('🔍 Filter Debug:', {
    selectedLocation: assignmentForm.locationId,
    totalBits: beats.length,
    filteredBits: filteredBits.length,
    totalSupervisors: supervisors.length,
    filteredSupervisors: filteredSupervisors.length,
  });

  // Filter operators for display
  const filteredOperators = operators.filter(operator => {
    // Skip null or invalid operators
    if (!operator || !operator.userId) {
      console.warn('⚠️ Skipping invalid operator in filter:', operator);
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = operator.userId.name?.toLowerCase().includes(query) || false;
      const matchesEmail = operator.userId.email?.toLowerCase().includes(query) || false;
      const matchesPhone = operator.userId.phone?.toLowerCase().includes(query) || false;
      if (!matchesName && !matchesEmail && !matchesPhone) return false;
    }

    // Location filter
    if (filterLocation && operator.locationId?._id !== filterLocation) return false;

    // Status filter
    if (filterStatus === 'assigned' && !operator.currentAssignment) return false;
    if (filterStatus === 'unassigned' && operator.currentAssignment) return false;

    return true;
  });

  const getStatusBadge = (operator: Operator) => {
    if (operator.currentAssignment) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Assigned
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
        Unassigned
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Safety check: Ensure all arrays are defined before rendering
  if (!operators || !locations || !beats || !supervisors) {
    console.error('⚠️ Missing data arrays:', { operators: !!operators, locations: !!locations, beats: !!beats, supervisors: !!supervisors });
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-2">Error loading data</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Guard Assignment Management</h1>
        <p className="text-gray-600 mt-1">Assign guards to BEATs and manage their assignments</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name, email, or phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Location</label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Locations</option>
              {locations && locations.map(location => (
                <option key={location._id} value={location._id}>
                  {location.locationName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Guards</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>

          <div className="flex items-end gap-3">
            <button
              onClick={() => openAssignModal()}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Assign Guard
            </button>
            <button
              onClick={fetchData}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Total Guards</div>
          <div className="text-2xl font-bold text-gray-900">{operators.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Assigned</div>
          <div className="text-2xl font-bold text-green-600">
            {operators.filter(op => op.currentAssignment).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Unassigned</div>
          <div className="text-2xl font-bold text-yellow-600">
            {operators.filter(op => !op.currentAssignment).length}
          </div>
        </div>
      </div>

      {/* Operators Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Guard
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Assignment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOperators.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No guards found
                </td>
              </tr>
            ) : (
              filteredOperators
                .filter(operator => operator && operator.userId)
                .map((operator) => {
                return (
                <tr key={operator._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{operator.userId?.name || 'Unknown'}</div>
                    {operator.locationId && (
                      <div className="text-sm text-gray-500">{operator.locationId?.locationName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{operator.userId?.phone}</div>
                    <div className="text-xs">{operator.userId?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {operator.currentAssignment ? (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {operator.currentAssignment?.beatId?.beatName || 'Unknown Beat'}
                        </div>
                        <div className="text-gray-500">
                          {operator.currentAssignment?.locationId?.locationName || 'Unknown Location'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Supervisor: {operator.currentAssignment?.supervisorId?.userId?.name || 'None'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {operator.currentAssignment?.shiftType} • {operator.currentAssignment?.assignmentType}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Not assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(operator)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openAssignModal(operator)}
                      className="text-blue-600 hover:text-blue-900 font-medium mr-3"
                    >
                      {operator.currentAssignment ? 'Change' : 'Assign'}
                    </button>
                    {operator.currentAssignment && (
                      <button
                        onClick={() => handleUnassign(operator._id, operator.currentAssignment!._id)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Unassign
                      </button>
                    )}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Assign Guard
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Assign a guard to a specific bit and location
                  </p>
                </div>
                <button
                  onClick={closeAssignModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAssignSubmit}>
                <div className="space-y-4">
                  {/* Operator Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Operator <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={assignmentForm.operatorId}
                      onChange={(e) => {
                        const operatorId = e.target.value;
                        const operator = operators.find(op => op._id === operatorId);
                        setSelectedOperator(operator || null);
                        
                        if (operator?.currentAssignment) {
                          setAssignmentForm({
                            operatorId,
                            locationId: operator.currentAssignment.locationId._id,
                            beatId: operator.currentAssignment.beatId._id,
                            supervisorId: operator.currentAssignment.supervisorId._id,
                            shiftType: operator.currentAssignment.shiftType || 'DAY',
                            assignmentType: operator.currentAssignment.assignmentType || 'PERMANENT',
                            startDate: operator.currentAssignment.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                          });
                        } else {
                          setAssignmentForm(prev => ({
                            ...prev,
                            operatorId,
                            locationId: operator?.locationId?._id || '',
                            beatId: '',
                            supervisorId: '',
                          }));
                        }
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose an operator...</option>
                      {operators
                        .filter(operator => operator && operator.userId)
                        .map((operator) => {
                          const fullName = operator.userId.name || `${operator.userId.firstName || ''} ${operator.userId.lastName || ''}`.trim();
                          return (
                            <option key={operator._id} value={operator._id}>
                              {fullName} - {operator.employeeId || operator._id.substring(0, 8)}
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  {/* Show selected operator with profile picture */}
                  {assignmentForm.operatorId && selectedOperator && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {selectedOperator.userId.profilePhoto ? (
                            <img
                              src={getImageUrl(selectedOperator.userId.profilePhoto)}
                              alt={selectedOperator.userId.name}
                              className="h-12 w-12 rounded-full object-cover border-2 border-blue-300"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center border-2 border-blue-300">
                              <User className="h-6 w-6 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedOperator.userId.name}</p>
                          <p className="text-sm text-gray-600">ID: {selectedOperator.employeeId || selectedOperator._id.substring(0, 8)}</p>
                          {selectedOperator.currentAssignment && (
                            <p className="text-xs text-amber-600 font-medium">Currently assigned</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={assignmentForm.locationId}
                      onChange={(e) => {
                        setAssignmentForm({
                          ...assignmentForm,
                          locationId: e.target.value,
                          beatId: '',
                          supervisorId: ''
                        });
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Location</option>
                      {locations && locations.map(location => (
                        <option key={location._id} value={location._id}>
                          {location.locationName} ({location.locationCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* BEAT */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      BEAT (Security Post) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={assignmentForm.beatId}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, beatId: e.target.value })}
                      required
                      disabled={!assignmentForm.locationId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select BEAT</option>
                      {filteredBits.map(bit => (
                        <option key={bit._id} value={bit._id}>
                          {bit.beatName} ({bit.beatCode}) - Needs {bit.numberOfOperators} guards
                        </option>
                      ))}
                    </select>
                    {!assignmentForm.locationId && (
                      <p className="text-xs text-gray-500 mt-1">Select a location first</p>
                    )}
                  </div>

                  {/* Supervisor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supervisor <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={assignmentForm.supervisorId}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, supervisorId: e.target.value })}
                      required
                      disabled={!assignmentForm.locationId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select Supervisor</option>
                      {filteredSupervisors.map(supervisor => (
                        <option key={supervisor._id} value={supervisor._id}>
                          {supervisor.fullName} - {supervisor.supervisorType?.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                    {!assignmentForm.locationId && (
                      <p className="text-xs text-gray-500 mt-1">Select a location first</p>
                    )}
                  </div>

                  {/* Shift Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shift Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={assignmentForm.shiftType}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, shiftType: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DAY">Day Shift</option>
                      <option value="NIGHT">Night Shift</option>
                      <option value="ROTATING">Rotating</option>
                    </select>
                  </div>

                  {/* Assignment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assignment Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={assignmentForm.assignmentType}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, assignmentType: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PERMANENT">Permanent</option>
                      <option value="TEMPORARY">Temporary</option>
                      <option value="RELIEF">Relief</option>
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={assignmentForm.startDate}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, startDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeAssignModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : (selectedOperator?.currentAssignment ? 'Update Assignment' : 'Assign Guard')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardAssignmentPage;
