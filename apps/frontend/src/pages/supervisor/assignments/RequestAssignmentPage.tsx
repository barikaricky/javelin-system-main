import { useState, useEffect } from 'react';
import { UserPlus, MapPin, Grid3x3, Users, ArrowLeft, User, Info } from 'lucide-react';
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
    passportPhoto?: string;
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

interface CurrentAssignment {
  _id: string;
  bitId: { _id: string; bitName: string };
  locationId: { _id: string; locationName: string };
  status: string;
}

export default function RequestAssignmentPage() {
  const navigate = useNavigate();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [bits, setBits] = useState<Bit[]>([]);
  const [filteredBits, setFilteredBits] = useState<Bit[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<CurrentAssignment | null>(null);
  const [isReassignment, setIsReassignment] = useState(false);
  const [supervisorId, setSupervisorId] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    operatorId: '',
    locationId: '',
    bitId: '',
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
    } else {
      setFilteredBits([]);
      setFormData(prev => ({ ...prev, bitId: '' }));
    }
  }, [formData.locationId, bits]);

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
      
      console.log('🔄 SUPERVISOR: Fetching assignment data...');
      
      const [operatorsRes, locationsRes, bitsRes, profileRes] = await Promise.all([
        api.get('/operators/my-operators').catch(err => {
          console.error('❌ Operators fetch failed:', err.response?.data || err.message);
          return { data: { operators: [] } };
        }),
        api.get('/locations').catch(err => {
          console.error('❌ Locations fetch failed:', err.response?.data || err.message);
          return { data: { locations: [] } };
        }),
        api.get('/bits').catch(err => {
          console.error('❌ Bits fetch failed:', err.response?.data || err.message);
          return { data: { bits: [] } };
        }),
        api.get('/supervisors/my-profile').catch(err => {
          console.error('❌ Profile fetch failed:', {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message,
            fullError: err
          });
          return { data: { supervisor: null } };
        }),
      ]);

      console.log('📦 SUPERVISOR: Raw API responses:');
      console.log('  - Operators:', operatorsRes.data);
      console.log('  - Locations:', locationsRes.data);
      console.log('  - Bits:', bitsRes.data);
      console.log('  - Profile FULL:', profileRes);
      console.log('  - Profile data:', profileRes.data);
      console.log('  - Profile data keys:', profileRes.data ? Object.keys(profileRes.data) : 'N/A');

      const operatorsData = operatorsRes.data.operators || operatorsRes.data.data || operatorsRes.data || [];
      const locationsData = locationsRes.data.locations || locationsRes.data.data || locationsRes.data || [];
      const bitsData = bitsRes.data.bits || bitsRes.data.data || bitsRes.data || [];

      console.log('📊 SUPERVISOR: Parsed data:');
      console.log('  - Operators count:', Array.isArray(operatorsData) ? operatorsData.length : 0);
      console.log('  - Locations count:', Array.isArray(locationsData) ? locationsData.length : 0);
      console.log('  - Bits count:', Array.isArray(bitsData) ? bitsData.length : 0);

      // Show all operators (don't filter by ACTIVE status for now)
      const allOperators = Array.isArray(operatorsData) ? operatorsData : [];
      
      console.log('📋 SUPERVISOR: All operators:', allOperators);
      if (allOperators.length > 0) {
        console.log('📋 First operator sample:', allOperators[0]);
        console.log('📋 First operator userId:', allOperators[0]?.userId);
        console.log('📋 First operator profilePhoto:', allOperators[0]?.userId?.profilePhoto);
        console.log('📋 First operator passportPhoto:', allOperators[0]?.userId?.passportPhoto);
        allOperators.forEach((op: any) => {
          const photo = op.userId?.profilePhoto || op.userId?.passportPhoto;
          console.log(`  - Operator ${op.employeeId}: status = ${op.userId?.status}, photo = ${photo}`);
        });
      }

      console.log('✅ SUPERVISOR: Setting data to state...');

      setOperators(allOperators);
      setLocations(Array.isArray(locationsData) ? locationsData : []);
      setBits(Array.isArray(bitsData) ? bitsData : []);
      
      // Extract supervisor ID - the backend returns { supervisor: { _id, ... }, ... }
      const extractedSupervisorId = profileRes.data?.supervisor?._id || profileRes.data?._id || '';
      console.log('👤 SUPERVISOR: Profile response:', profileRes.data);
      console.log('👤 SUPERVISOR: Supervisor object:', profileRes.data?.supervisor);
      console.log('👤 SUPERVISOR: Extracted ID:', extractedSupervisorId);
      
      if (!extractedSupervisorId) {
        console.error('❌ SUPERVISOR: Failed to extract supervisor ID from profile response');
        toast.error('Failed to load supervisor profile. Please try logging in again.');
      }
      
      setSupervisorId(extractedSupervisorId);
      
      console.log('✅ SUPERVISOR: Data set complete');
      console.log('✅ Final operators in state:', allOperators.length);
    } catch (error: any) {
      console.error('❌ Failed to fetch data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🔍 SUBMIT: Form validation check');
    console.log('  - operatorId:', formData.operatorId);
    console.log('  - locationId:', formData.locationId);
    console.log('  - bitId:', formData.bitId);
    console.log('  - supervisorId:', supervisorId);

    if (!formData.operatorId || !formData.locationId || !formData.bitId || !supervisorId) {
      const missing = [];
      if (!formData.operatorId) missing.push('operator');
      if (!formData.locationId) missing.push('location');
      if (!formData.bitId) missing.push('bit');
      if (!supervisorId) missing.push('supervisor ID');
      
      console.error('❌ SUBMIT: Missing fields:', missing.join(', '));
      toast.error(`Please fill in all required fields. Missing: ${missing.join(', ')}`);
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        operatorId: formData.operatorId,
        locationId: formData.locationId,
        bitId: formData.bitId,
        supervisorId: supervisorId,
        shiftType: formData.shiftType,
        assignmentType: formData.assignmentType,
        startDate: formData.startDate,
      };
      
      const response = await api.post('/assignments', payload);
      
      if (response.data.assignment?.status === 'PENDING') {
        toast.success('Assignment request submitted - awaiting General Supervisor approval');
      } else {
        toast.success('Assignment request submitted successfully');
      }
      
      // Navigate back to dashboard
      navigate('/supervisor/dashboard');
      
    } catch (error: any) {
      console.error('Failed to submit assignment request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit assignment request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/supervisor/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <UserPlus className="h-8 w-8 text-blue-600" />
              {isReassignment ? 'Request Operator Reassignment' : 'Request Operator Assignment'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isReassignment 
                ? 'Request to change operator assignment to a new location and bit'
                : 'Request to assign one of your operators to a location and bit'}
            </p>
          </div>

          {/* Approval Required Notice */}
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-900">Approval Required</p>
                <p className="text-sm text-yellow-800">
                  This assignment request will be sent to the General Supervisor for approval before becoming active.
                </p>
              </div>
            </div>
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
                    Upon approval, the current assignment will end and a new one will be created.
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  {(() => {
                    const selectedOp = operators.find(op => op._id === formData.operatorId);
                    if (!selectedOp) return null;
                    const fullName = selectedOp.userId 
                      ? `${selectedOp.userId.firstName} ${selectedOp.userId.lastName}`
                      : selectedOp.fullName || 'Unknown';
                    const profilePhoto = selectedOp.userId?.profilePhoto || selectedOp.userId?.passportPhoto;
                    
                    return (
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {profilePhoto ? (
                            <img
                              src={getImageUrl(profilePhoto)}
                              alt={fullName}
                              className="h-12 w-12 rounded-full object-cover border-2 border-blue-300"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center border-2 border-blue-300">
                              <User className="h-6 w-6 text-blue-600" />
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
                  bitId: ''
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                Shift Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.shiftType}
                onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/supervisor/dashboard')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.operatorId || !formData.locationId || !formData.bitId}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Submit Request for Approval
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Assignment Request Info</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Select one of your registered operators</li>
              <li>• Choose the location where the operator will be assigned</li>
              <li>• Select a specific bit within the chosen location</li>
              <li>• Your request will be reviewed by the General Supervisor</li>
              <li>• The operator will be notified once the assignment is approved</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
