import { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Users, 
  User,
  ChevronDown,
  RefreshCw,
  Calendar,
  Phone,
  Mail,
  Grid3x3,
  Building2,
  UserCheck,
  Sun,
  Moon,
  Repeat,
  Download,
  X,
  Eye,
  AlertCircle
} from 'lucide-react';
import { api, getImageUrl } from '../../../lib/api';
import { toast } from 'react-hot-toast';

interface OnDutyPerson {
  _id: string;
  operatorId: {
    _id: string;
    employeeId: string;
    salary?: number;
    userId: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      phoneNumber?: string;
      profilePhoto?: string;
      passportPhoto?: string;
      status: string;
    };
  };
  supervisorId?: {
    _id: string;
    userId: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  beatId?: {
    _id: string;
    beatName: string;
    beatCode: string;
  };
  locationId?: {
    _id: string;
    locationName: string;
    address: string;
    city: string;
    state: string;
  };
  shiftType: string;
  assignmentType?: string;
  status: string;
  startDate: string;
  endDate?: string;
}

export default function GSOnDutyPage() {
  const [personnel, setPersonnel] = useState<OnDutyPerson[]>([]);
  const [filteredPersonnel, setFilteredPersonnel] = useState<OnDutyPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<OnDutyPerson | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchOnDutyPersonnel();
  }, []);

  useEffect(() => {
    filterPersonnel();
  }, [searchTerm, selectedShift, selectedLocation, personnel]);

  const fetchOnDutyPersonnel = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('🔍 Fetching on-duty personnel from /general-supervisor/dashboard...');
      const response = await api.get('/general-supervisor/dashboard');
      console.log('📦 Raw API Response:', {
        status: response.status,
        hasData: !!response.data,
        hasOnDutyPersonnel: !!response.data?.onDutyPersonnel,
        dataKeys: response.data ? Object.keys(response.data) : [],
        fullData: response.data
      });
      console.log('🎯 OnDutyPersonnel value:', response.data?.onDutyPersonnel);
      console.log('🎯 OnDutyPersonnel type:', typeof response.data?.onDutyPersonnel);
      console.log('🎯 OnDutyPersonnel isArray:', Array.isArray(response.data?.onDutyPersonnel));
      
      const onDutyData = response.data.onDutyPersonnel || [];
      
      console.log('📋 On Duty Personnel Fetched (GS):', {
        count: onDutyData.length,
        sample: onDutyData.slice(0, 2).map((p: any) => ({
          operatorName: p.operatorId?.userId ? `${p.operatorId.userId.firstName} ${p.operatorId.userId.lastName}` : 'Unknown',
          shift: p.shiftType,
          location: p.locationId?.locationName,
          status: p.status
        }))
      });
      
      setPersonnel(onDutyData);
      setFilteredPersonnel(onDutyData);

      if (isRefresh) {
        toast.success('Data refreshed successfully');
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch on-duty personnel:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error('Failed to load on-duty personnel');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterPersonnel = () => {
    let filtered = [...personnel];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => {
        const user = p.operatorId?.userId;
        const fullName = user ? `${user.firstName} ${user.lastName}`.toLowerCase() : '';
        const employeeId = p.operatorId?.employeeId?.toLowerCase() || '';
        const location = p.locationId?.locationName?.toLowerCase() || '';
        const bit = p.beatId?.beatName?.toLowerCase() || '';
        
        return fullName.includes(searchTerm.toLowerCase()) ||
               employeeId.includes(searchTerm.toLowerCase()) ||
               location.includes(searchTerm.toLowerCase()) ||
               bit.includes(searchTerm.toLowerCase());
      });
    }

    // Shift filter
    if (selectedShift !== 'all') {
      filtered = filtered.filter(p => p.shiftType === selectedShift);
    }

    // Location filter
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(p => p.locationId?._id === selectedLocation);
    }

    setFilteredPersonnel(filtered);
  };

  const getUniqueLocations = () => {
    const locations = personnel
      .map(p => p.locationId)
      .filter((loc, index, self) => 
        loc && self.findIndex(l => l?._id === loc._id) === index
      );
    return locations as NonNullable<OnDutyPerson['locationId']>[];
  };

  const getShiftIcon = (shift: string) => {
    switch (shift) {
      case 'DAY': return <Sun className="w-4 h-4" />;
      case 'NIGHT': return <Moon className="w-4 h-4" />;
      case 'ROTATING': return <Repeat className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case 'DAY': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'NIGHT': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'ROTATING': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const viewDetails = (person: OnDutyPerson) => {
    setSelectedPerson(person);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const exportToCSV = () => {
    const csvData = filteredPersonnel.map(p => {
      const user = p.operatorId?.userId;
      return {
        Name: user ? `${user.firstName} ${user.lastName}` : 'N/A',
        EmployeeID: p.operatorId?.employeeId || 'N/A',
        Shift: p.shiftType || 'N/A',
        Location: p.locationId?.locationName || 'N/A',
        Beat: p.beatId?.beatName || 'N/A',
        Supervisor: p.supervisorId?.userId ? `${p.supervisorId.userId.firstName} ${p.supervisorId.userId.lastName}` : 'N/A',
        Status: p.status || 'N/A',
        StartDate: formatDate(p.startDate)
      };
    });

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `on-duty-personnel-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('Export completed');
  };

  const getStatsByShift = () => {
    const stats = {
      DAY: personnel.filter(p => p.shiftType === 'DAY').length,
      NIGHT: personnel.filter(p => p.shiftType === 'NIGHT').length,
      ROTATING: personnel.filter(p => p.shiftType === 'ROTATING').length
    };
    return stats;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading on-duty personnel...</p>
        </div>
      </div>
    );
  }

  const shiftStats = getStatsByShift();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                On Duty Personnel
              </h1>
              <p className="text-gray-600 mt-2">
                Real-time view of all operators currently on active duty
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportToCSV}
                disabled={filteredPersonnel.length === 0}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => fetchOnDutyPersonnel(true)}
                disabled={refreshing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UserCheck className="w-5 h-5 text-purple-600" />
                </div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{personnel.length}</p>
              <p className="text-xs text-gray-600">Total On Duty</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Sun className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{shiftStats.DAY}</p>
              <p className="text-xs text-gray-600">Day Shift</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Moon className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{shiftStats.NIGHT}</p>
              <p className="text-xs text-gray-600">Night Shift</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Repeat className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{shiftStats.ROTATING}</p>
              <p className="text-xs text-gray-600">Rotating</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, ID, location, or bit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2 justify-center"
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shift Type</label>
                  <select
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Shifts</option>
                    <option value="DAY">Day Shift</option>
                    <option value="NIGHT">Night Shift</option>
                    <option value="ROTATING">Rotating Shift</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Locations</option>
                    {getUniqueLocations().map(location => (
                      <option key={location._id} value={location._id}>
                        {location.locationName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredPersonnel.length}</span> of{' '}
          <span className="font-semibold text-gray-900">{personnel.length}</span> personnel
        </div>

        {/* Personnel Grid */}
        {filteredPersonnel.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Personnel Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedShift !== 'all' || selectedLocation !== 'all'
                ? 'Try adjusting your filters or search term'
                : 'No operators are currently on active duty'}
            </p>
            {(searchTerm || selectedShift !== 'all' || selectedLocation !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedShift('all');
                  setSelectedLocation('all');
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPersonnel.map((person, index) => {
              const operator = person.operatorId;
              const user = operator?.userId;
              if (!operator || !user) return null;

              const profilePhoto = user.profilePhoto || user.passportPhoto;
              const operatorName = `${user.firstName} ${user.lastName}`;
              const supervisor = person.supervisorId?.userId;
              const supervisorName = supervisor ? `${supervisor.firstName} ${supervisor.lastName}` : 'N/A';

              return (
                <div
                  key={person._id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getShiftColor(person.shiftType)} bg-white`}>
                        {getShiftIcon(person.shiftType)}
                        <span className="text-xs font-semibold">{person.shiftType}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium">Active</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    {/* Profile Section */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative flex-shrink-0">
                        {profilePhoto ? (
                          <img
                            src={getImageUrl(profilePhoto)}
                            alt={operatorName}
                            className="w-16 h-16 rounded-full object-cover border-4 border-purple-100 shadow-md"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-4 border-purple-100 shadow-md ${profilePhoto ? 'hidden' : ''}`}>
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full border-2 border-white"></div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg truncate">{operatorName}</h3>
                        <p className="text-sm text-gray-600">ID: {operator.employeeId}</p>
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'ACTIVE' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                      {person.locationId && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-900">{person.locationId.locationName}</p>
                            <p className="text-xs text-gray-500">{person.locationId.city}, {person.locationId.state}</p>
                          </div>
                        </div>
                      )}

                      {person.beatId && (
                        <div className="flex items-center gap-2 text-sm">
                          <Grid3x3 className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-gray-700">{person.beatId.beatName}</p>
                            <p className="text-xs text-gray-500">{person.beatId.beatCode}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-700">Supervisor: {supervisorName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-700">Since: {formatDate(person.startDate)}</p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => viewDetails(person)}
                      className="mt-4 w-full py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all flex items-center justify-center gap-2 font-medium shadow-md group-hover:shadow-lg"
                    >
                      <Eye className="w-4 h-4" />
                      View Full Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Modal - Same as manager version but with purple theme */}
      {showDetailsModal && selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white relative">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                {(() => {
                  const user = selectedPerson.operatorId?.userId;
                  const profilePhoto = user?.profilePhoto || user?.passportPhoto;
                  const operatorName = user ? `${user.firstName} ${user.lastName}` : 'N/A';

                  return (
                    <>
                      {profilePhoto ? (
                        <img
                          src={getImageUrl(profilePhoto)}
                          alt={operatorName}
                          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div className={`w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg ${profilePhoto ? 'hidden' : ''}`}>
                        {user?.firstName[0]}{user?.lastName[0]}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{operatorName}</h2>
                        <p className="text-purple-100">Employee ID: {selectedPerson.operatorId?.employeeId}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Contact Information
                </h3>
                <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{selectedPerson.operatorId?.userId.email}</span>
                  </div>
                  {(selectedPerson.operatorId?.userId.phone || selectedPerson.operatorId?.userId.phoneNumber) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        {selectedPerson.operatorId?.userId.phone || selectedPerson.operatorId?.userId.phoneNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  Assignment Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Shift Type</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getShiftColor(selectedPerson.shiftType)}`}>
                      {getShiftIcon(selectedPerson.shiftType)}
                      <span className="font-semibold">{selectedPerson.shiftType}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Status</p>
                    <span className="inline-block px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg font-semibold">
                      {selectedPerson.status}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Start Date</p>
                    <p className="font-semibold text-gray-900">{formatDate(selectedPerson.startDate)}</p>
                  </div>

                  {selectedPerson.assignmentType && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-1">Assignment Type</p>
                      <p className="font-semibold text-gray-900">{selectedPerson.assignmentType}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location & Beat */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  Location & Beat
                </h3>
                <div className="space-y-3">
                  {selectedPerson.locationId && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900">{selectedPerson.locationId.locationName}</p>
                          <p className="text-sm text-gray-600">{selectedPerson.locationId.address}</p>
                          <p className="text-sm text-gray-600">{selectedPerson.locationId.city}, {selectedPerson.locationId.state}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPerson.beatId && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Grid3x3 className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="font-semibold text-gray-900">{selectedPerson.beatId.beatName}</p>
                          <p className="text-sm text-gray-600">Code: {selectedPerson.beatId.beatCode}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Supervisor */}
              {selectedPerson.supervisorId && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                    Supervisor
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-900">
                      {selectedPerson.supervisorId.userId.firstName} {selectedPerson.supervisorId.userId.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{selectedPerson.supervisorId.userId.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
