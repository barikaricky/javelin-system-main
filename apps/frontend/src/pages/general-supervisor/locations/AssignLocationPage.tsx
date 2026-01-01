import { useState, useEffect } from 'react';
import { MapPin, Users, Target, CheckCircle, XCircle, RefreshCw, Search, Filter, AlertCircle, Building2 } from 'lucide-react';
import { api, getImageUrl } from '../../../lib/api';
import toast from 'react-hot-toast';

interface Supervisor {
  _id: string;
  employeeId: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePhoto?: string;
    passportPhoto?: string;
  };
  locationId?: {
    _id: string;
    locationName: string;
    city: string;
    state: string;
  } | string;
  supervisorType: string;
  status: string;
}

interface Location {
  _id: string;
  locationName: string;
  address: string;
  city: string;
  state: string;
  locationType: string;
  isActive: boolean;
}

export default function AssignLocationPage() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [supervisorsRes, locationsRes] = await Promise.all([
        api.get('/general-supervisor/my-supervisors'),
        api.get('/locations')
      ]);

      console.log('📊 Supervisors response:', supervisorsRes.data);
      console.log('📍 Locations response:', locationsRes.data);

      // The response is an array directly, not wrapped in a data property
      const supervisorsData = Array.isArray(supervisorsRes.data) 
        ? supervisorsRes.data 
        : supervisorsRes.data.supervisors || supervisorsRes.data.data || [];
      
      const locationsData = locationsRes.data.locations || locationsRes.data.data || locationsRes.data || [];

      console.log('📊 Parsed supervisors:', supervisorsData);
      console.log('📍 Parsed locations:', locationsData);

      // Filter only regular supervisors (not General Supervisors) with APPROVED status
      const regularSupervisors = Array.isArray(supervisorsData) 
        ? supervisorsData.filter((s: any) => 
            (s.supervisorType === 'SUPERVISOR' || s.type === 'SUPERVISOR') && 
            (s.status === 'APPROVED' || s.approvalStatus === 'APPROVED')
          )
        : [];

      console.log('👥 Regular supervisors (filtered):', regularSupervisors);
      console.log('🏢 All locations:', locationsData);

      setSupervisors(regularSupervisors);
      setLocations(Array.isArray(locationsData) ? locationsData : []);

      if (showRefreshToast) {
        toast.success('Data refreshed successfully');
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAssignLocation = async () => {
    if (!selectedSupervisor || !selectedLocation) {
      toast.error('Please select a location');
      return;
    }

    try {
      setIsAssigning(true);

      await api.patch(`/general-supervisor/supervisors/${selectedSupervisor._id}/location`, {
        locationId: selectedLocation
      });

      toast.success('Location assigned successfully');
      setShowAssignModal(false);
      setSelectedSupervisor(null);
      setSelectedLocation('');
      fetchData(false);
    } catch (error: any) {
      console.error('❌ Failed to assign location:', error);
      toast.error(error.response?.data?.message || 'Failed to assign location');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassignLocation = async (supervisor: Supervisor) => {
    if (!confirm(`Are you sure you want to unassign ${supervisor.userId.firstName} ${supervisor.userId.lastName} from their current location?`)) {
      return;
    }

    try {
      await api.patch(`/general-supervisor/supervisors/${supervisor._id}/location`, {
        locationId: null
      });

      toast.success('Location unassigned successfully');
      fetchData(false);
    } catch (error: any) {
      console.error('❌ Failed to unassign location:', error);
      toast.error(error.response?.data?.message || 'Failed to unassign location');
    }
  };

  const openAssignModal = (supervisor: Supervisor) => {
    setSelectedSupervisor(supervisor);
    setSelectedLocation(
      typeof supervisor.locationId === 'object' && supervisor.locationId?._id
        ? supervisor.locationId._id
        : typeof supervisor.locationId === 'string'
        ? supervisor.locationId
        : ''
    );
    setShowAssignModal(true);
  };

  const handleRefresh = () => {
    fetchData(true);
  };

  const filteredSupervisors = supervisors.filter(supervisor => {
    const fullName = `${supervisor.userId.firstName} ${supervisor.userId.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                         supervisor.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'assigned') {
      return matchesSearch && supervisor.locationId;
    } else if (filterStatus === 'unassigned') {
      return matchesSearch && !supervisor.locationId;
    }
    return matchesSearch;
  });

  const getLocationInfo = (locationData: any) => {
    if (!locationData) return null;
    if (typeof locationData === 'string') return null;
    return locationData;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading supervisors and locations...</p>
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
              <Target className="h-8 w-8 text-blue-600" />
              Assign Supervisors to Locations
            </h1>
            <p className="text-gray-600 mt-2">
              Manage supervisor location assignments
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Supervisors</p>
                <p className="text-2xl font-bold text-gray-900">{supervisors.length}</p>
              </div>
              <Users className="h-10 w-10 text-blue-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-green-600">
                  {supervisors.filter(s => s.locationId).length}
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {supervisors.filter(s => !s.locationId).length}
                </p>
              </div>
              <XCircle className="h-10 w-10 text-yellow-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Supervisors</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Location Assignment</p>
              <p className="text-sm text-blue-800 mt-1">
                Assign supervisors to specific locations. Each supervisor can manage one location and its security bits.
              </p>
            </div>
          </div>
        </div>

        {/* Supervisors List */}
        {filteredSupervisors.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Supervisors Found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all'
                ? 'No supervisors match your search criteria'
                : 'No supervisors available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredSupervisors.map((supervisor) => {
              const location = getLocationInfo(supervisor.locationId);
              const supervisorName = `${supervisor.userId.firstName} ${supervisor.userId.lastName}`;
              const profilePhoto = supervisor.userId.profilePhoto || supervisor.userId.passportPhoto;

              return (
                <div
                  key={supervisor._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Profile Photo */}
                    <div className="flex-shrink-0">
                      {profilePhoto ? (
                        <img
                          src={getImageUrl(profilePhoto)}
                          alt={supervisorName}
                          className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                          <Users className="h-8 w-8 text-blue-600" />
                        </div>
                      )}
                    </div>

                    {/* Supervisor Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {supervisorName}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        ID: {supervisor.employeeId} • {supervisor.userId.email}
                      </p>

                      {/* Current Assignment */}
                      <div className="mb-4">
                        {location ? (
                          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-green-900 truncate">
                                {location.locationName}
                              </p>
                              <p className="text-xs text-green-700">
                                {location.city}, {location.state}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                            <p className="text-sm text-yellow-800">No location assigned</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openAssignModal(supervisor)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <Target className="h-4 w-4" />
                          {location ? 'Reassign' : 'Assign Location'}
                        </button>
                        {location && (
                          <button
                            onClick={() => handleUnassignLocation(supervisor)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                          >
                            <XCircle className="h-4 w-4" />
                            Unassign
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign Location Modal */}
      {showAssignModal && selectedSupervisor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="h-6 w-6 text-blue-600" />
                {getLocationInfo(selectedSupervisor.locationId) ? 'Reassign Location' : 'Assign Location'}
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedSupervisor.userId.firstName} {selectedSupervisor.userId.lastName} ({selectedSupervisor.employeeId})
              </p>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Location <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
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

              {selectedLocation && locations.find(l => l._id === selectedLocation) && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  {(() => {
                    const loc = locations.find(l => l._id === selectedLocation)!;
                    return (
                      <div className="flex items-start gap-3">
                        <Building2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-blue-900">{loc.locationName}</p>
                          <p className="text-sm text-blue-700">{loc.address}</p>
                          <p className="text-sm text-blue-700">{loc.city}, {loc.state}</p>
                          <p className="text-xs text-blue-600 mt-1">Type: {loc.locationType}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {locations.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  No locations available. Please create locations first.
                </p>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedSupervisor(null);
                  setSelectedLocation('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isAssigning}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignLocation}
                disabled={!selectedLocation || isAssigning}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isAssigning ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Assign Location
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
