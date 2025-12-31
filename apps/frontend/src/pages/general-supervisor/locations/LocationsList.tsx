import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Building,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  RefreshCw,
  Eye,
  MoreVertical,
  UserCheck,
  AlertCircle,
  Activity,
  Shield
} from 'lucide-react';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';

interface Location {
  _id: string;
  locationName: string;
  address: string;
  city: string;
  state: string;
  locationType: string;
  isActive: boolean;
  operatorCount: number;
  supervisorCount: number;
  assignedSupervisors: Array<{
    id: string;
    name: string;
  }>;
}

interface Bit {
  _id: string;
  bitName: string;
  bitCode: string;
  locationId: {
    _id: string;
    locationName: string;
    city: string;
    state: string;
  };
  description?: string;
  securityType: string[];
  numberOfOperators: number;
  shiftType: string;
  isActive: boolean;
}


export default function LocationsList() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [bits, setBits] = useState<Bit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'locations' | 'bits'>('locations');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [locationsResponse, bitsResponse] = await Promise.all([
        api.get('/general-supervisor/locations'),
        api.get('/bits').catch(() => ({ data: { bits: [] } })) // Fallback if bits endpoint fails
      ]);
      
      console.log('📍 Locations Response:', locationsResponse.data);
      console.log('🛡️ Bits Response:', bitsResponse.data);
      
      setLocations(locationsResponse.data || []);
      setBits(bitsResponse.data?.bits || bitsResponse.data || []);
      toast.success('Data loaded successfully');
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load locations and bits');
      setLocations([]);
      setBits([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique states for filter
  const states = [...new Set(locations.map(loc => loc.state).filter(Boolean))];

  const filteredLocations = locations.filter(loc => {
    const matchesSearch = 
      loc.locationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && loc.isActive) ||
      (statusFilter === 'inactive' && !loc.isActive);
    
    const matchesState = stateFilter === 'all' || loc.state === stateFilter;
    
    return matchesSearch && matchesStatus && matchesState;
  });

  const filteredBits = bits.filter(bit => {
    const matchesSearch = 
      bit.bitName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bit.bitCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bit.locationId?.locationName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && bit.isActive) ||
      (statusFilter === 'inactive' && !bit.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle size={12} />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        <Clock size={12} />
        Inactive
      </span>
    );
  };

  const getShiftLabel = (shift: string) => {
    const labels: Record<string, string> = {
      'DAY': 'Day',
      'NIGHT': 'Night',
      '24_HOURS': '24 Hours',
      'ROTATING': 'Rotating'
    };
    return labels[shift] || shift;
  };

  const stats = {
    totalLocations: locations.length,
    activeLocations: locations.filter(l => l.isActive).length,
    totalBits: bits.length,
    activeBits: bits.filter(b => b.isActive).length,
    totalOperators: locations.reduce((sum, l) => sum + (l.operatorCount || 0), 0),
    totalSupervisors: locations.reduce((sum, l) => sum + (l.supervisorCount || 0), 0)
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations & Security Bits</h1>
          <p className="text-gray-600">View and monitor all security locations and posts</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('locations')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'locations'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building size={16} className="inline mr-2" />
              Locations
            </button>
            <button
              onClick={() => setViewMode('bits')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'bits'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield size={16} className="inline mr-2" />
              Security Bits
            </button>
          </div>
          
          <button 
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Locations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLocations}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Locations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeLocations}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Security Bits</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBits}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserCheck size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Guards</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOperators}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${viewMode === 'locations' ? 'locations' : 'bits'} by name or address...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* State Filter (Locations only) */}
          {viewMode === 'locations' && (
            <div className="relative">
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All States</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>
      </div>


      {/* LOCATIONS VIEW */}
      {viewMode === 'locations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((location) => (
            <div 
              key={location._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{location.locationName}</h3>
                      <p className="text-xs text-gray-600 mt-1">{location.locationType?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  {getStatusBadge(location.isActive)}
                </div>
              </div>

              {/* Address */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{location.address}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <span>{location.city}</span>
                  <span>•</span>
                  <span>{location.state}</span>
                </div>
              </div>

              {/* Assigned Supervisors */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Assigned Supervisors ({location.supervisorCount})</p>
                {location.assignedSupervisors && location.assignedSupervisors.length > 0 ? (
                  <div className="space-y-1">
                    {location.assignedSupervisors.slice(0, 2).map((supervisor) => (
                      <div key={supervisor.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-xs">
                          {supervisor.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <span className="text-sm text-gray-700">{supervisor.name}</span>
                      </div>
                    ))}
                    {location.assignedSupervisors.length > 2 && (
                      <p className="text-xs text-gray-500 ml-8">
                        +{location.assignedSupervisors.length - 2} more
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">No supervisors assigned</div>
                )}
              </div>

              {/* Staffing Stats */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xl font-bold text-blue-600">{location.operatorCount || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">Guards</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-xl font-bold text-purple-600">{location.supervisorCount || 0}</p>
                    <p className="text-xs text-gray-600 mt-1">Supervisors</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BITS VIEW */}
      {viewMode === 'bits' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBits.map((bit) => (
            <div 
              key={bit._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Shield size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{bit.bitName}</h3>
                      <p className="text-xs text-gray-600 mt-1">Code: {bit.bitCode}</p>
                    </div>
                  </div>
                  {getStatusBadge(bit.isActive)}
                </div>
              </div>

              {/* Location Info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{bit.locationId?.locationName || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{bit.locationId?.city}, {bit.locationId?.state}</p>
                  </div>
                </div>
              </div>

              {/* Bit Details */}
              <div className="px-4 py-3 border-b border-gray-100">
                {bit.description && (
                  <p className="text-sm text-gray-600 mb-2">{bit.description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Shift Type</p>
                    <p className="font-medium text-gray-900">{getShiftLabel(bit.shiftType)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Security Type</p>
                    <p className="font-medium text-gray-900">
                      {bit.securityType?.length > 0 ? bit.securityType[0].replace(/_/g, ' ') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Guards Count */}
              <div className="p-4">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-xl font-bold text-purple-600">{bit.numberOfOperators || 0}</p>
                  <p className="text-xs text-gray-600 mt-1">Required Guards</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {((viewMode === 'locations' && filteredLocations.length === 0) || 
        (viewMode === 'bits' && filteredBits.length === 0)) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          {viewMode === 'locations' ? (
            <Building size={48} className="mx-auto text-gray-300 mb-4" />
          ) : (
            <Shield size={48} className="mx-auto text-gray-300 mb-4" />
          )}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {viewMode === 'locations' ? 'locations' : 'security bits'} found
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : `No ${viewMode === 'locations' ? 'locations' : 'security bits'} have been assigned yet`}
          </p>
          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setStateFilter('all');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

