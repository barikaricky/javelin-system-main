import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';
import { toast } from 'react-hot-toast';

interface Operator {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
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
      firstName: string;
      lastName: string;
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
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'operators' | 'supervisors'>('operators');
  
  const [operators, setOperators] = useState<Operator[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [beats, setBits] = useState<Beat[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Assignment form state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  
  // Supervisor management state
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  
  const [assignmentForm, setAssignmentForm] = useState({
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
      const [operatorsRes, locationsRes, bitsRes, supervisorsRes] = await Promise.all([
        api.get('/general-supervisor/operators?includeAssignments=true'),
        api.get('/locations?isActive=true&limit=500'),
        api.get('/beats?isActive=all&limit=500'),
        api.get('/general-supervisor/subordinates?limit=500')
      ]);

      setOperators(operatorsRes.data.operators || []);
      setLocations(locationsRes.data.locations || []);
      setBits(bitsRes.data.beats || []);
      setSupervisors(supervisorsRes.data.supervisors || []);
      
      console.log('✅ Data fetched:', {
        operators: operatorsRes.data.operators?.length || 0,
        locations: locationsRes.data.locations?.length || 0,
        beats: bitsRes.data.beats?.length || 0,
        supervisors: supervisorsRes.data.supervisors?.length || 0,
      });
      
      console.log('📊 Sample supervisor data:', supervisorsRes.data.supervisors?.[0]);
      console.log('📊 Sample bit data:', bitsRes.data.beats?.[0]);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (operator: Operator) => {
    setSelectedOperator(operator);
    
    // Pre-fill form if operator has existing assignment
    if (operator.currentAssignment) {
      setAssignmentForm({
        locationId: operator.currentAssignment.locationId._id,
        beatId: operator.currentAssignment.beatId._id,
        supervisorId: operator.currentAssignment.supervisorId._id,
        shiftType: operator.currentAssignment.shiftType,
        assignmentType: operator.currentAssignment.assignmentType,
        startDate: operator.currentAssignment.startDate.split('T')[0]
      });
    } else if (operator.locationId) {
      setAssignmentForm({
        ...assignmentForm,
        locationId: operator.locationId._id
      });
    }
    
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedOperator(null);
    setAssignmentForm({
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
    
    if (!selectedOperator) return;
    
    // Validation
    if (!assignmentForm.locationId || !assignmentForm.beatId || !assignmentForm.supervisorId) {
      toast.error('Please select Location, BEAT, and Supervisor');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        operatorId: selectedOperator._id,
        beatId: assignmentForm.beatId,
        supervisorId: assignmentForm.supervisorId,
        shiftType: assignmentForm.shiftType,
        assignmentType: assignmentForm.assignmentType,
        startDate: assignmentForm.startDate
      };

      if (selectedOperator.currentAssignment) {
        // Update existing assignment
        await api.put(`/assignments/${selectedOperator.currentAssignment._id}`, payload);
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
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const fullName = `${operator.userId.firstName} ${operator.userId.lastName}`.toLowerCase();
      const matchesName = fullName.includes(query);
      const matchesEmail = operator.userId.email.toLowerCase().includes(query);
      const matchesPhone = operator.userId.phone.toLowerCase().includes(query);
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assignment Management</h1>
        <p className="text-gray-600 mt-1">Manage guard and supervisor assignments</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('operators')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'operators'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assign Guards to BEATs
            </button>
            <button
              onClick={() => setActiveTab('supervisors')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'supervisors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manage Supervisors
            </button>
          </nav>
        </div>
      </div>

      {/* Operators Tab */}
      {activeTab === 'operators' && (
        <>
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
              {locations.map(location => (
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

          <div className="flex items-end">
            <button
              onClick={fetchData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              filteredOperators.map((operator) => (
                <tr key={operator._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {operator.userId.firstName} {operator.userId.lastName}
                    </div>
                    {operator.locationId && (
                      <div className="text-sm text-gray-500">{operator.locationId.locationName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{operator.userId.phone}</div>
                    <div className="text-xs">{operator.userId.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {operator.currentAssignment ? (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {operator.currentAssignment.beatId.beatName}
                        </div>
                        <div className="text-gray-500">
                          {operator.currentAssignment.locationId.locationName}
                        </div>
                        <div className="text-xs text-gray-500">
                          Supervisor: {operator.currentAssignment.supervisorId.userId.firstName} {operator.currentAssignment.supervisorId.userId.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {operator.currentAssignment.shiftType} • {operator.currentAssignment.assignmentType}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedOperator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedOperator.currentAssignment ? 'Change Assignment' : 'Assign Guard'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Guard: {selectedOperator.userId.firstName} {selectedOperator.userId.lastName}
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
                      {locations.map(location => (
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
                    {submitting ? 'Saving...' : (selectedOperator.currentAssignment ? 'Update Assignment' : 'Assign Guard')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Supervisors Tab */}
      {activeTab === 'supervisors' && (
        <>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Supervisor Management
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Assign supervisors to locations and manage their operators
            </p>

            {/* Supervisors Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supervisor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Location
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
                  {supervisors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No supervisors found
                      </td>
                    </tr>
                  ) : (
                    supervisors.map((supervisor) => {
                      const locationName = supervisor.locationId 
                        ? (typeof supervisor.locationId === 'string' 
                            ? locations.find(l => l._id === supervisor.locationId)?.locationName || 'Unknown'
                            : supervisor.locationId.locationName)
                        : 'Not assigned';
                      
                      return (
                        <tr key={supervisor._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {supervisor.userId.firstName} {supervisor.userId.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{supervisor.supervisorType}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{supervisor.userId.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{locationName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {supervisor.locationId ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Assigned
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => {
                                setSelectedSupervisor(supervisor);
                                setShowSupervisorModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 font-medium mr-3"
                            >
                              Manage Location
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Supervisor Location Assignment Modal */}
      {showSupervisorModal && selectedSupervisor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Assign Supervisor to Location
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {selectedSupervisor.userId.firstName} {selectedSupervisor.userId.lastName}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSupervisorModal(false);
                    setSelectedSupervisor(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedSupervisor) return;

                try {
                  setSubmitting(true);
                  const formData = new FormData(e.currentTarget);
                  const locationId = formData.get('locationId') as string;

                  await api.patch(`/general-supervisor/supervisors/${selectedSupervisor._id}/location`, {
                    locationId: locationId || null
                  });

                  toast.success('Supervisor location updated successfully');
                  setShowSupervisorModal(false);
                  setSelectedSupervisor(null);
                  
                  // Refresh data
                  await fetchData();
                } catch (error: any) {
                  console.error('Error updating supervisor location:', error);
                  toast.error(error.response?.data?.message || 'Failed to update supervisor location');
                } finally {
                  setSubmitting(false);
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <select
                      name="locationId"
                      defaultValue={
                        typeof selectedSupervisor.locationId === 'string'
                          ? selectedSupervisor.locationId
                          : selectedSupervisor.locationId?._id || ''
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No Location (Unassign)</option>
                      {locations.map(location => (
                        <option key={location._id} value={location._id}>
                          {location.locationName} ({location.locationCode})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select a location to assign this supervisor to manage that area
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSupervisorModal(false);
                      setSelectedSupervisor(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : 'Update Location'}
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
