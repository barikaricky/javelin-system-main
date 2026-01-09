import { useState, useEffect } from 'react';
import { MapPin, Grid3x3, Users, Building2, RefreshCw, Phone, Mail, MapPinned, Info, ChevronDown, ChevronUp, DollarSign, Calendar, User, Eye, X } from 'lucide-react';
import { api, getImageUrl } from '../../../lib/api';
import toast from 'react-hot-toast';

interface Location {
  _id: string;
  locationName: string;
  address: string;
  city: string;
  state: string;
  locationType: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
}

interface Operator {
  _id: string;
  employeeId: string;
  salary?: number;
  dateJoined?: string;
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
  shiftType?: string;
  assignmentType?: string;
  assignmentStatus?: string;
  assignedDate?: string;
}

interface BitWithOperators extends Beat {
  operators: Operator[];
  expanded?: boolean;
}

interface Beat {
  _id: string;
  bitCode: string;
  bitName: string;
  description?: string;
  numberOfOperators?: number;
  isActive: boolean;
}

interface AssignedLocation {
  location: Location;
  beats: BitWithOperators[];
  assignedOperatorsCount: number;
}

export default function MyBitsPage() {
  const [assignedLocations, setAssignedLocations] = useState<AssignedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [supervisorInfo, setSupervisorInfo] = useState<any>(null);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [showOperatorModal, setShowOperatorModal] = useState(false);

  useEffect(() => {
    fetchMyBits();
  }, []);

  const fetchMyBits = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch supervisor profile to get assigned location
      const profileRes = await api.get('/supervisors/my-profile');
      const supervisor = profileRes.data.supervisor;
      setSupervisorInfo(supervisor);

      console.log('👤 Supervisor profile:', supervisor);

      if (!supervisor.locationId) {
        setAssignedLocations([]);
        if (showRefreshToast) {
          toast.success('Refreshed - No location assigned');
        }
        return;
      }

      // Fetch location details
      const locationId = typeof supervisor.locationId === 'string' 
        ? supervisor.locationId 
        : supervisor.locationId._id;

      const locationRes = await api.get(`/locations/${locationId}`);
      const location = locationRes.data.location || locationRes.data;

      console.log('📍 Location details:', location);

      // Fetch beats for this location
      const bitsRes = await api.get('/beats', {
        params: { locationId }
      });

      const allBits = bitsRes.data.beats || bitsRes.data.data || [];
      const locationBits = allBits.filter((bit: any) => {
        const bitLocationId = typeof bit.locationId === 'string'
          ? bit.locationId
          : bit.locationId?._id;
        return bitLocationId === locationId;
      });

      console.log('🎯 Beats for location:', locationBits);

      // Fetch assignments and operators for each bit
      const assignmentsRes = await api.get('/assignments', {
        params: { 
          locationId, 
          status: 'ACTIVE',
          populate: 'operatorId,bitId'
        }
      });

      const assignments = assignmentsRes.data.assignments || [];
      console.log('👥 All active assignments:', assignments);
      
      // Debug first operator structure
      if (assignments.length > 0 && assignments[0].operatorId) {
        console.log('📸 First operator structure:', assignments[0].operatorId);
        console.log('📸 Has userId?:', !!assignments[0].operatorId.userId);
        console.log('📸 userId data:', assignments[0].operatorId.userId);
      }

      // Enhance beats with operator details
      const bitsWithOperators = await Promise.all(
        locationBits.map(async (bit: Beat) => {
          // Get assignments for this bit
          const bitAssignments = assignments.filter((a: any) => {
            const assignmentBitId = typeof a.bitId === 'string' ? a.bitId : a.bitId?._id;
            return assignmentBitId === bit._id;
          });

          // Extract operators from assignments with assignment details
          const operators = bitAssignments.map((a: any) => {
            if (!a.operatorId) return null;
            return {
              ...a.operatorId,
              shiftType: a.shiftType,
              assignmentType: a.assignmentType,
              assignmentStatus: a.status,
              assignedDate: a.createdAt
            };
          }).filter((op: any) => op);

          console.log(`🎯 Beat ${bit.bitName}: ${operators.length} operators`, operators);

          return {
            ...bit,
            operators,
            expanded: false
          };
        })
      );

      const totalOperators = bitsWithOperators.reduce((sum, bit) => sum + bit.operators.length, 0);

      setAssignedLocations([{
        location,
        beats: bitsWithOperators,
        assignedOperatorsCount: totalOperators
      }]);

      if (showRefreshToast) {
        toast.success('Data refreshed successfully');
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch beats:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch assigned locations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchMyBits(true);
  };

  const toggleBitExpansion = (locationIndex: number, bitIndex: number) => {
    console.log('🔄 Toggling bit expansion:', { locationIndex, bitIndex });
    setAssignedLocations(prev => {
      const updated = prev.map((loc, locIdx) => {
        if (locIdx === locationIndex) {
          return {
            ...loc,
            beats: loc.beats.map((bit, bIdx) => {
              if (bIdx === bitIndex) {
                console.log('✅ Toggling bit:', bit.bitName, 'from', bit.expanded, 'to', !bit.expanded);
                return { ...bit, expanded: !bit.expanded };
              }
              return bit;
            })
          };
        }
        return loc;
      });
      return updated;
    });
  };

  const viewOperatorDetails = (operator: Operator) => {
    setSelectedOperator(operator);
    setShowOperatorModal(true);
  };

  const formatSalary = (salary?: number) => {
    if (!salary) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(salary);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getLocationTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      RESIDENTIAL: 'bg-blue-100 text-blue-800',
      COMMERCIAL: 'bg-purple-100 text-purple-800',
      INDUSTRIAL: 'bg-orange-100 text-orange-800',
      GOVERNMENT: 'bg-green-100 text-green-800',
      EDUCATIONAL: 'bg-yellow-100 text-yellow-800',
      HEALTHCARE: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your assigned locations...</p>
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
              <MapPin className="h-8 w-8 text-blue-600" />
              My Locations & Beats
            </h1>
            <p className="text-gray-600 mt-2">
              View and manage your assigned locations and security beats
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

        {/* No Assignment Message */}
        {assignedLocations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Location Assigned</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              You don't have any locations assigned yet. Please contact your General Supervisor to get assigned to a location.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {assignedLocations.map(({ location, beats, assignedOperatorsCount }, locIndex) => (
              <div key={location._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Location Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Building2 className="h-6 w-6" />
                        <h2 className="text-2xl font-bold">{location.locationName}</h2>
                      </div>
                      <div className="flex items-center gap-2 text-blue-100 mb-2">
                        <MapPinned className="h-4 w-4" />
                        <span className="text-sm">{location.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-100">
                        <span className="text-sm">{location.city}, {location.state}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLocationTypeColor(location.locationType)} bg-white bg-opacity-90`}>
                        {location.locationType}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium text-center ${location.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {location.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location Details */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Contact Information */}
                    {location.contactPerson && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Contact Person</p>
                          <p className="font-medium text-gray-900">{location.contactPerson}</p>
                        </div>
                      </div>
                    )}
                    {location.contactPhone && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Phone className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Phone</p>
                          <p className="font-medium text-gray-900">{location.contactPhone}</p>
                        </div>
                      </div>
                    )}
                    {location.contactEmail && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Mail className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Email</p>
                          <p className="font-medium text-gray-900">{location.contactEmail}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="p-4 bg-blue-50 border-b border-blue-100">
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Grid3x3 className="h-5 w-5 text-blue-600" />
                      <span className="text-sm text-gray-600">
                        <span className="font-bold text-gray-900 text-lg">{beats.length}</span> Beat{beats.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-gray-600">
                        <span className="font-bold text-gray-900 text-lg">{assignedOperatorsCount}</span> Active Operator{assignedOperatorsCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Beats List */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Grid3x3 className="h-5 w-5 text-blue-600" />
                    Security Beats & Assigned Operators
                  </h3>
                  
                  {beats.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                      <Grid3x3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">No beats assigned to this location yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {beats.map((bit, bitIndex) => (
                        <div
                          key={bit._id}
                          className="border border-gray-200 rounded-lg bg-white overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {/* Beat Header */}
                          <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Grid3x3 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{bit.bitName}</h4>
                                  <p className="text-xs text-gray-500">Code: {bit.bitCode}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      bit.isActive
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {bit.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-full">
                                    <Users className="h-3.5 w-3.5 text-blue-600" />
                                    <span className="text-xs font-semibold text-blue-900">
                                      {bit.operators.length} Operator{bit.operators.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                  {bit.operators.length > 0 && (
                                    <button
                                      onClick={() => toggleBitExpansion(locIndex, bitIndex)}
                                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                                      title={bit.expanded ? "Click to hide operators" : "Click to view operators"}
                                    >
                                      {bit.expanded ? (
                                        <>
                                          <ChevronUp className="h-4 w-4" />
                                          <span>Hide Operators</span>
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="h-4 w-4" />
                                          <span>View Operators</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {bit.description && (
                              <p className="text-sm text-gray-600 mt-2">
                                {bit.description}
                              </p>
                            )}
                            
                            {bit.numberOfOperators && (
                              <div className="flex items-center gap-2 text-sm mt-2">
                                <Info className="h-4 w-4 text-amber-600" />
                                <span className="text-gray-600">
                                  Required: <span className="font-semibold text-gray-900">{bit.numberOfOperators}</span> guard{bit.numberOfOperators !== 1 ? 's' : ''}
                                  {bit.operators.length < bit.numberOfOperators && (
                                    <span className="text-amber-600 ml-2">
                                      ({bit.numberOfOperators - bit.operators.length} more needed)
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Operators List (Expandable) */}
                          {bit.expanded && bit.operators.length > 0 && (
                            <div className="p-4 bg-white">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {bit.operators.map((operator, idx) => {
                                  if (idx === 0) {
                                    console.log('🖼️ First operator data:', operator);
                                    console.log('🖼️ userId:', operator.userId);
                                    console.log('🖼️ profilePhoto:', operator.userId?.profilePhoto);
                                    console.log('🖼️ passportPhoto:', operator.userId?.passportPhoto);
                                  }
                                  
                                  const operatorName = operator.userId ? 
                                    `${operator.userId.firstName} ${operator.userId.lastName}` : 
                                    'Unknown Operator';
                                  const profilePhoto = operator.userId?.profilePhoto || operator.userId?.passportPhoto;
                                  
                                  if (idx === 0) {
                                    console.log('🖼️ Final photo path:', profilePhoto);
                                    console.log('🖼️ Image URL:', profilePhoto ? getImageUrl(profilePhoto) : 'No photo');
                                  }

                                  return (
                                    <div
                                      key={operator._id}
                                      className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all bg-gray-50"
                                    >
                                      <div className="flex items-start gap-3">
                                        {profilePhoto ? (
                                          <img
                                            src={getImageUrl(profilePhoto)}
                                            alt={operatorName}
                                            className="h-14 w-14 rounded-full object-cover border-2 border-gray-200"
                                            onError={(e) => {
                                              console.error('❌ Image failed to load:', getImageUrl(profilePhoto));
                                              e.currentTarget.style.display = 'none';
                                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                            }}
                                          />
                                        ) : null}
                                        <div className={`h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200 ${profilePhoto ? 'hidden' : ''}`}>
                                          <User className="h-7 w-7 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h5 className="font-semibold text-gray-900 truncate">{operatorName}</h5>
                                          <p className="text-xs text-gray-600 mb-2">ID: {operator.employeeId}</p>
                                          
                                          <div className="space-y-1">
                                            {operator.shiftType && (
                                              <div className="flex items-center gap-1">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                  operator.shiftType === 'DAY' ? 'bg-yellow-100 text-yellow-800' :
                                                  operator.shiftType === 'NIGHT' ? 'bg-indigo-100 text-indigo-800' :
                                                  'bg-purple-100 text-purple-800'
                                                }`}>
                                                  {operator.shiftType} Shift
                                                </span>
                                              </div>
                                            )}
                                            {operator.assignmentType && (
                                              <div className="flex items-center gap-1">
                                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                  {operator.assignmentType}
                                                </span>
                                              </div>
                                            )}
                                            {operator.salary && (
                                              <div className="flex items-center gap-1">
                                                <DollarSign className="h-3 w-3 text-green-600" />
                                                <span className="text-xs font-medium text-green-700">
                                                  {formatSalary(operator.salary)}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                          
                                          <button
                                            onClick={() => viewOperatorDetails(operator)}
                                            className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                          >
                                            <Eye className="h-3 w-3" />
                                            View Full Details
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* No Operators Message */}
                          {bit.operators.length === 0 && (
                            <div className="p-4 text-center bg-amber-50 border-t border-amber-100">
                              <Users className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                              <p className="text-sm text-amber-800">No operators assigned to this bit</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Footer */}
        {assignedLocations.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">About Your Assignment</p>
                <p>
                  You are responsible for supervising security operations at this location and its associated beats. 
                  Make sure all beats are properly staffed and operators are performing their duties effectively.
                  Click on any bit to expand and view assigned operators.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Operator Details Modal */}
      {showOperatorModal && selectedOperator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <User className="h-6 w-6 text-blue-600" />
                Operator Details
              </h2>
              <button
                onClick={() => setShowOperatorModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Profile Section */}
              <div className="flex items-start gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                {selectedOperator.userId.profilePhoto || selectedOperator.userId.passportPhoto ? (
                  <img
                    src={getImageUrl(selectedOperator.userId.profilePhoto || selectedOperator.userId.passportPhoto!)}
                    alt={`${selectedOperator.userId.firstName} ${selectedOperator.userId.lastName}`}
                    className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-md">
                    <User className="h-12 w-12 text-blue-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedOperator.userId.firstName} {selectedOperator.userId.lastName}
                  </h3>
                  <p className="text-gray-600">Employee ID: {selectedOperator.employeeId}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedOperator.userId.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {selectedOperator.userId.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{selectedOperator.userId.email}</span>
                  </div>
                  {selectedOperator.userId.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{selectedOperator.userId.phoneNumber}</span>
                    </div>
                  )}
                </div>

                {/* Employment Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 mb-2">Employment Details</h4>
                  {selectedOperator.dateJoined && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Joined: {formatDate(selectedOperator.dateJoined)}
                      </span>
                    </div>
                  )}
                  {selectedOperator.salary && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-gray-600">
                        Salary: <span className="font-semibold text-green-700">{formatSalary(selectedOperator.salary)}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Assignment Details */}
                {(selectedOperator.shiftType || selectedOperator.assignmentType) && (
                  <div className="space-y-3 md:col-span-2">
                    <h4 className="font-semibold text-gray-900 mb-2">Assignment Details</h4>
                    <div className="flex flex-wrap gap-4">
                      {selectedOperator.shiftType && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Shift:</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {selectedOperator.shiftType}
                          </span>
                        </div>
                      )}
                      {selectedOperator.assignmentType && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Type:</span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                            {selectedOperator.assignmentType}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowOperatorModal(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
