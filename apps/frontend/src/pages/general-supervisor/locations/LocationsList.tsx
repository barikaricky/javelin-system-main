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
  Activity
} from 'lucide-react';

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  status: 'active' | 'inactive' | 'understaffed';
  supervisor: {
    id: string;
    name: string;
    isPresent: boolean;
  } | null;
  operatorCount: number;
  requiredOperators: number;
  currentlyOnDuty: number;
  todayIncidents: number;
  lastVisit: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

// Mock data
const mockLocations: Location[] = [
  {
    id: 'loc-001',
    name: 'Downtown Office',
    address: '100 Business Avenue',
    city: 'New York',
    status: 'active',
    supervisor: { id: 'sup-001', name: 'John Smith', isPresent: true },
    operatorCount: 5,
    requiredOperators: 5,
    currentlyOnDuty: 4,
    todayIncidents: 0,
    lastVisit: '2 hours ago',
    coordinates: { lat: 40.7128, lng: -74.0060 }
  },
  {
    id: 'loc-002',
    name: 'North Mall',
    address: '200 Shopping Boulevard',
    city: 'New York',
    status: 'understaffed',
    supervisor: { id: 'sup-002', name: 'Sarah Johnson', isPresent: false },
    operatorCount: 4,
    requiredOperators: 6,
    currentlyOnDuty: 2,
    todayIncidents: 1,
    lastVisit: '4 hours ago',
    coordinates: { lat: 40.7300, lng: -73.9950 }
  },
  {
    id: 'loc-003',
    name: 'Tech Park',
    address: '300 Innovation Drive',
    city: 'New York',
    status: 'active',
    supervisor: { id: 'sup-003', name: 'Michael Williams', isPresent: true },
    operatorCount: 3,
    requiredOperators: 3,
    currentlyOnDuty: 3,
    todayIncidents: 0,
    lastVisit: '1 day ago',
    coordinates: { lat: 40.7500, lng: -74.0100 }
  },
  {
    id: 'loc-004',
    name: 'East Campus',
    address: '400 College Road',
    city: 'Brooklyn',
    status: 'active',
    supervisor: { id: 'sup-004', name: 'Emily Brown', isPresent: false },
    operatorCount: 6,
    requiredOperators: 6,
    currentlyOnDuty: 5,
    todayIncidents: 2,
    lastVisit: '6 hours ago',
    coordinates: { lat: 40.6892, lng: -73.9857 }
  },
  {
    id: 'loc-005',
    name: 'West Plaza',
    address: '500 Commerce Street',
    city: 'Jersey City',
    status: 'inactive',
    supervisor: null,
    operatorCount: 0,
    requiredOperators: 4,
    currentlyOnDuty: 0,
    todayIncidents: 0,
    lastVisit: '1 week ago',
    coordinates: { lat: 40.7282, lng: -74.0776 }
  },
  {
    id: 'loc-006',
    name: 'South Terminal',
    address: '600 Transit Lane',
    city: 'Newark',
    status: 'understaffed',
    supervisor: { id: 'sup-005', name: 'David Davis', isPresent: true },
    operatorCount: 2,
    requiredOperators: 5,
    currentlyOnDuty: 1,
    todayIncidents: 3,
    lastVisit: '30 minutes ago',
    coordinates: { lat: 40.7357, lng: -74.1724 }
  }
];

export default function LocationsList() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setLocations(mockLocations);
      setLoading(false);
    };
    fetchLocations();
  }, []);

  // Get unique cities for filter
  const cities = [...new Set(locations.map(loc => loc.city))];

  const filteredLocations = locations.filter(loc => {
    const matchesSearch = 
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || loc.status === statusFilter;
    const matchesCity = cityFilter === 'all' || loc.city === cityFilter;
    return matchesSearch && matchesStatus && matchesCity;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle size={12} />
            Active
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <Clock size={12} />
            Inactive
          </span>
        );
      case 'understaffed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertTriangle size={12} />
            Understaffed
          </span>
        );
      default:
        return null;
    }
  };

  const stats = {
    total: locations.length,
    active: locations.filter(l => l.status === 'active').length,
    understaffed: locations.filter(l => l.status === 'understaffed').length,
    totalOperators: locations.reduce((sum, l) => sum + l.currentlyOnDuty, 0)
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
          <h1 className="text-2xl font-bold text-gray-900">Locations / Bits</h1>
          <p className="text-gray-600">View and monitor all security locations and staffing</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
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
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Understaffed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.understaffed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserCheck size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">On Duty Now</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOperators}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Understaffed Alert */}
      {stats.understaffed > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">{stats.understaffed} location(s) need attention</p>
            <p className="text-red-600 text-sm">These locations are currently understaffed and may require immediate action.</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search locations by name or address..."
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
              <option value="understaffed">Understaffed</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* City Filter */}
          <div className="relative">
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLocations.map((location) => (
          <div 
            key={location.id}
            className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${
              location.status === 'understaffed' ? 'border-red-200' : 'border-gray-100'
            }`}
          >
            {/* Card Header */}
            <div className={`p-4 ${location.status === 'understaffed' ? 'bg-red-50' : 'bg-gray-50'} border-b border-gray-100`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 ${location.status === 'understaffed' ? 'bg-red-100' : 'bg-blue-100'} rounded-lg`}>
                    <Building size={20} className={location.status === 'understaffed' ? 'text-red-600' : 'text-blue-600'} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{location.name}</h3>
                    {getStatusBadge(location.status)}
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setSelectedLocation(selectedLocation === location.id ? null : location.id)}
                    className="p-1 rounded hover:bg-gray-200"
                  >
                    <MoreVertical size={18} className="text-gray-500" />
                  </button>
                  {selectedLocation === location.id && (
                    <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[150px] z-10">
                      <Link
                        to={`/gs/locations/${location.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Eye size={16} />
                        View Details
                      </Link>
                      <Link
                        to={`/gs/locations/${location.id}/activity`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Activity size={16} />
                        Activity Log
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} />
                <span>{location.address}, {location.city}</span>
              </div>
            </div>

            {/* Supervisor Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              {location.supervisor ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-xs">
                      {location.supervisor.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm text-gray-600">{location.supervisor.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    location.supervisor.isPresent 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {location.supervisor.isPresent ? 'On Site' : 'Away'}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">No supervisor assigned</div>
              )}
            </div>

            {/* Staffing Stats */}
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className={`text-lg font-bold ${
                    location.currentlyOnDuty < location.requiredOperators ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {location.currentlyOnDuty}/{location.requiredOperators}
                  </p>
                  <p className="text-xs text-gray-500">On Duty</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">{location.operatorCount}</p>
                  <p className="text-xs text-gray-500">Total Staff</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className={`text-lg font-bold ${location.todayIncidents > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                    {location.todayIncidents}
                  </p>
                  <p className="text-xs text-gray-500">Incidents</p>
                </div>
              </div>

              {/* Staffing Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Staffing Level</span>
                  <span>{Math.round((location.currentlyOnDuty / location.requiredOperators) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      location.currentlyOnDuty >= location.requiredOperators 
                        ? 'bg-green-500' 
                        : location.currentlyOnDuty >= location.requiredOperators * 0.7 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((location.currentlyOnDuty / location.requiredOperators) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Last Visit */}
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-500">Last visited:</span>
                <span className="text-gray-600">{location.lastVisit}</span>
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
              <Link
                to={`/gs/locations/${location.id}`}
                className="flex-1 text-center py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                View Details
              </Link>
              <Link
                to={`/gs/locations/${location.id}/operators`}
                className="flex-1 text-center py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                View Staff
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredLocations.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Building size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'all' || cityFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No locations have been assigned yet'}
          </p>
          {(searchQuery || statusFilter !== 'all' || cityFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCityFilter('all');
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
