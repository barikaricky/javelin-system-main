import { useState, useEffect } from 'react';
import { UserPlus, MapPin, Grid3x3, Users, ArrowLeft, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, getImageUrl } from '../../../lib/api';
import toast from 'react-hot-toast';

interface Operator {
  _id: string;
  id?: string;
  employeeId: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    profilePhoto?: string;
    status: string;
  };
  fullName?: string;
}

interface Location {
  _id: string;
  locationName: string;
  city: string;
  state: string;
  address: string;
  locationType: string;
  isActive: boolean;
}

interface Bit {
  _id: string;
  bitCode: string;
  bitName: string;
  description?: string;
  locationId: string | { _id: string };
  isActive: boolean;
  numberOfOperators?: number;
}

interface Supervisor {
  _id: string;
  fullName: string;
  supervisorType: string;
  locationId?: string | { _id: string };
  userId: {
    _id: string;
    name: string;
  };
}

interface CurrentAssignment {
  _id: string;
  bitId: { _id: string; bitName: string };
  locationId: { _id: string; locationName: string };
  status: string;
}

export default function AssignOperatorPage() {
  const navigate = useNavigate();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [bits, setBits] = useState<Bit[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [filteredBits, setFilteredBits] = useState<Bit[]>([]);
  const [filteredSupervisors, setFilteredSupervisors] = useState<Supervisor[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<CurrentAssignment | null>(null);
  const [isReassignment, setIsReassignment] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    operatorId: '',
    locationId: '',
    bitId: '',
    supervisorId: '',
    shiftType: 'DAY',
    assignmentType: 'PERMANENT',
    startDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.operatorId) {
      checkOperatorAssignment(formData.operatorId);
    } else {
      setCurrentAssignment(null);
      setIsReassignment(false);
    }
  }, [formData.operatorId]);

  useEffect(() => {
    if (formData.locationId) {
      // Filter bits by location
      const filtered = bits.filter(bit => {
        const bitLocationId = typeof bit.locationId === 'string' 
          ? bit.locationId 
          : bit.locationId?._id;
        return bitLocationId === formData.locationId;
      });
      setFilteredBits(filtered);
      if (formData.bitId && !filtered.find(b => b._id === formData.bitId)) {
        setFormData(prev => ({ ...prev, bitId: '' }));
      }

      // Filter supervisors by location
      const filteredSups = supervisors.filter(sup => {
        if (!sup.locationId) return false;
        const supLocationId = typeof sup.locationId === 'string' ? sup.locationId : sup.locationId._id;
        return supLocationId === formData.locationId;
      });
      console.log('🔍 Supervisor filtering:', {
        selectedLocationId: formData.locationId,
        totalSupervisors: supervisors.length,
        filteredSupervisors: filteredSups.length,
      });
      setFilteredSupervisors(filteredSups);
      if (formData.supervisorId && !filteredSups.find(s => s._id === formData.supervisorId)) {
        setFormData(prev => ({ ...prev, supervisorId: '' }));
      }
    } else {
      setFilteredBits([]);
      setFilteredSupervisors(supervisors); // Show all when no location selected
      setFormData(prev => ({ ...prev, bitId: '', supervisorId: '' }));
    }
  }, [formData.locationId, bits, supervisors]);

  const checkOperatorAssignment = async (operatorId: string) => {
    try {
      const response = await api.get(`/assignments/operators/${operatorId}/assignments`);
      const assignments = response.data.assignments || [];
      const active = assignments.find((a: any) => a.status === 'ACTIVE');
      
      if (active) {
        setCurrentAssignment(active);
        setIsReassignment(true);
        // Pre-fill form with current assignment
        setFormData(prev => ({
          ...prev,
          locationId: active.locationId?._id || '',
          bitId: active.bitId?._id || '',
        }));
      } else {
        setCurrentAssignment(null);
        setIsReassignment(false);
      }
    } catch (error) {
      console.error('Error checking operator assignment:', error);
      setCurrentAssignment(null);
      setIsReassignment(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 SECRETARY: Fetching assignment data...');
      
      const [operatorsRes, locationsRes, bitsRes, supervisorsRes] = await Promise.all([
        api.get('/secretaries/operators').catch(err => {
          console.error('❌ Operators fetch failed:', err.response?.data || err.message);
          throw err;
        }),
        api.get('/locations').catch(err => {
          console.error('❌ Locations fetch failed:', err.response?.data || err.message);
          throw err;
        }),
        api.get('/bits').catch(err => {
          console.error('❌ Bits fetch failed:', err.response?.data || err.message);
          throw err;
        }),
        api.get('/secretaries/supervisors?approvalStatus=APPROVED&limit=500').catch(err => {
          console.error('❌ Supervisors fetch failed:', err.response?.data || err.message);
          throw err;
        }),
      ]);

      console.log('📦 SECRETARY: Raw API responses:');
      console.log('  - Operators:', operatorsRes.data);
      console.log('  - Locations:', locationsRes.data);
      console.log('  - Bits:', bitsRes.data);
      console.log('  - Supervisors RAW:', supervisorsRes);
      console.log('  - Supervisors DATA:', supervisorsRes.data);
      console.log('✅ Supervisors response:', supervisorsRes.data);

      const operatorsData = operatorsRes.data.operators || operatorsRes.data.data || operatorsRes.data || [];
      const locationsData = locationsRes.data.locations || locationsRes.data.data || locationsRes.data || [];
      const bitsData = bitsRes.data.bits || bitsRes.data.data || bitsRes.data || [];
      const supervisorsData = supervisorsRes.data.supervisors || supervisorsRes.data.data || supervisorsRes.data || [];

      console.log('📊 SECRETARY: Parsed data:');
      console.log('  - Operators:', operatorsData.length);
      console.log('  - Locations:', locationsData.length);
      console.log('  - Bits:', bitsData.length);
      console.log('  - Supervisors:', supervisorsData.length);
      console.log('  - Supervisors array:', supervisorsData);
      console.log('  - First supervisor:', supervisorsData[0]);
      console.log('  - Is Array?', Array.isArray(supervisorsData));

      setOperators(Array.isArray(operatorsData) ? operatorsData : []);
      setLocations(Array.isArray(locationsData) ? locationsData : []);
      setBits(Array.isArray(bitsData) ? bitsData : []);
      const validSupervisors = Array.isArray(supervisorsData) ? supervisorsData : [];
      console.log('✅ SECRETARY: Setting supervisors to state:', validSupervisors.length);
      setSupervisors(validSupervisors);
      setFilteredSupervisors(validSupervisors);
      console.log('✅ SECRETARY: All data set to state');
    } catch (error: any) {
      console.error('❌ Failed to fetch data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.operatorId || !formData.locationId || !formData.bitId || !formData.supervisorId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        operatorId: formData.operatorId,
        locationId: formData.locationId,
        bitId: formData.bitId,
        supervisorId: formData.supervisorId,
        shiftType: formData.shiftType,
        assignmentType: formData.assignmentType,
        startDate: formData.startDate,
      };
      
      if (isReassignment && currentAssignment) {
        // End current assignment and create new one
        await api.delete(`/assignments/${currentAssignment._id}`);
        
        // Create new assignment
        await api.post('/assignments/assign', payload);
        
        toast.success('Operator reassigned successfully!');
      } else {
        // New assignment
        await api.post('/assignments/assign', payload);
        
        toast.success('Operator assigned successfully!');
      }
      
      // Refresh data
      await fetchData();
      
      setFormData({
        operatorId: '',
        locationId: '',
        bitId: '',
        supervisorId: '',
        shiftType: 'DAY',
        assignmentType: 'PERMANENT',
        startDate: new Date().toISOString().split('T')[0],
      });
      setCurrentAssignment(null);
      setIsReassignment(false);
      
    } catch (error: any) {
      console.error('Failed to assign operator:', error);
      toast.error(error.response?.data?.message || `Failed to ${isReassignment ? 'reassign' : 'assign'} operator`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/secretary')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <UserPlus className="h-8 w-8 text-purple-600" />
              {isReassignment ? 'Reassign Operator' : 'Assign Operator'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isReassignment 
                ? 'Change operator assignment to a new location and bit'
                : 'Assign an operator to a location and bit'}
            </p>
          </div>
          
          {/* Current Assignment Warning */}
          {isReassignment && currentAssignment && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-amber-900 mb-1">Current Assignment</h3>
                  <p className="text-sm text-amber-800">
                    This operator is currently assigned to <strong>{currentAssignment.bitId?.bitName}</strong> at <strong>{currentAssignment.locationId?.locationName}</strong>.
                    <br />
                    Saving will end the current assignment and create a new one.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Select Operator
                </div>
              </label>
              <select
                value={formData.operatorId}
                onChange={(e) => setFormData({ ...formData, operatorId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Choose an operator...</option>
                {operators.map((operator) => {
                  const fullName = operator.userId 
                    ? `${operator.userId.firstName} ${operator.userId.lastName}`
                    : operator.fullName || 'Unknown';
                  return (
                    <option key={operator._id} value={operator._id}>
                      {fullName} - {operator.employeeId}
                    </option>
                  );
                })}
              </select>
              
              {/* Show selected operator with profile picture */}
              {formData.operatorId && operators.find(op => op._id === formData.operatorId) && (
                <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  {(() => {
                    const selectedOp = operators.find(op => op._id === formData.operatorId);
                    if (!selectedOp) return null;
                    const fullName = selectedOp.userId 
                      ? `${selectedOp.userId.firstName} ${selectedOp.userId.lastName}`
                      : selectedOp.fullName || 'Unknown';
                    const profilePhoto = selectedOp.userId?.profilePhoto;
                    
                    return (
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {profilePhoto ? (
                            <img
                              src={getImageUrl(profilePhoto)}
                              alt={fullName}
                              className="h-12 w-12 rounded-full object-cover border-2 border-purple-300"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-purple-200 flex items-center justify-center border-2 border-purple-300">
                              <User className="h-6 w-6 text-purple-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{fullName}</p>
                          <p className="text-sm text-gray-600">ID: {selectedOp.employeeId}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              
              {operators.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">No operators available</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Select Location
                </div>
              </label>
              <select
                value={formData.locationId}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  locationId: e.target.value,
                  bitId: '',
                  supervisorId: ''
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Choose a location...</option>
                {locations.map((location) => (
                  <option key={location._id} value={location._id}>
                    {location.locationName} - {location.city}, {location.state}
                  </option>
                ))}
              </select>
              {locations.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">No locations available</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Grid3x3 className="h-4 w-4" />
                  Select Bit <span className="text-red-500">*</span>
                </div>
              </label>
              <select
                value={formData.bitId}
                onChange={(e) => setFormData({ ...formData, bitId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!formData.locationId}
                required
              >
                <option value="">Choose a bit...</option>
                {filteredBits.map((bit) => (
                  <option key={bit._id} value={bit._id}>
                    {bit.bitName} ({bit.bitCode}){bit.numberOfOperators ? ` - Needs ${bit.numberOfOperators} guards` : ''}
                  </option>
                ))}
              </select>
              {!formData.locationId && (
                <p className="text-sm text-gray-500 mt-1">Please select a location first</p>
              )}
              {formData.locationId && filteredBits.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">No bits available for this location</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Select Supervisor <span className="text-red-500">*</span>
                </div>
              </label>
              <select
                value={formData.supervisorId}
                onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!formData.locationId}
                required
              >
                <option value="">Choose a supervisor...</option>
                {filteredSupervisors.map((supervisor) => (
                  <option key={supervisor._id} value={supervisor._id}>
                    {supervisor.fullName} - {supervisor.supervisorType?.replace('_', ' ')}
                  </option>
                ))}
              </select>
              {!formData.locationId && (
                <p className="text-sm text-gray-500 mt-1">Please select a location first</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shift Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.shiftType}
                onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="DAY">Day Shift</option>
                <option value="NIGHT">Night Shift</option>
                <option value="ROTATING">Rotating</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.assignmentType}
                onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="PERMANENT">Permanent</option>
                <option value="TEMPORARY">Temporary</option>
                <option value="RELIEF">Relief</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/secretary')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.operatorId || !formData.locationId || !formData.bitId || !formData.supervisorId}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    {isReassignment ? 'Reassigning...' : 'Assigning...'}
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    {isReassignment ? 'Reassign Operator' : 'Assign Operator'}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Assignment Info</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Select an operator from the list of registered operators</li>
              <li>• Choose the location where the operator will be assigned</li>
              <li>• Select a specific bit within the chosen location</li>
              <li>• The operator will be notified of their assignment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
