import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Building2, TrendingUp, Edit } from 'lucide-react';
import axios from 'axios';
import { getApiBaseURL } from '../../../lib/api';

interface Location {
  _id: string;
  locationName: string;
  city: string;
  state: string;
  address: string;
  locationType: string;
  isActive: boolean;
  totalBits: number;
  contactPerson?: string;
  contactPhone?: string;
}

interface LocationStats {
  total: number;
  active: number;
  totalBits: number;
  byState: Array<{ _id: string; count: number; totalBits: number }>;
}

export const DirectorLocationsListPage = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [stats, setStats] = useState<LocationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');

  useEffect(() => {
    fetchLocations();
    fetchStats();
  }, [searchQuery, filterState, filterActive]);

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterState) params.append('state', filterState);
      if (filterActive !== 'all') params.append('isActive', filterActive);
      
      const API_URL = getApiBaseURL();
      const response = await axios.get(
        `${API_URL}/api/locations?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLocations(response.data.locations || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = getApiBaseURL();
      const response = await axios.get(`${API_URL}/api/locations/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getLocationTypeLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Locations Overview</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">View all operational locations and their statistics</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Total Locations</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600" />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Active</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
                </div>
                <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Inactive</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-600 mt-1">{stats.total - stats.active}</p>
                </div>
                <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Total Bits</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">{stats.totalBits}</p>
                </div>
                <MapPin className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              aria-label="Filter by status"
              title="Filter by status"
              className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>

            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              aria-label="Filter by state"
              title="Filter by state"
              className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All States</option>
              {stats?.byState.map(s => (
                <option key={s._id} value={s._id}>{s._id} ({s.count})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Locations List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
          </div>
        ) : locations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <Building2 className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No locations found</h3>
            <p className="text-sm sm:text-base text-gray-600">No locations match your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {locations.map(location => (
              <div
                key={location._id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6"
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                      <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                        {location.locationName}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                        location.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {location.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">{location.city}, {location.state}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{location.address}</p>
                </div>

                <div className="pt-3 sm:pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium text-gray-900 text-right">
                      {getLocationTypeLabel(location.locationType)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-3">
                    <span className="text-gray-600">Bits:</span>
                    <span className="font-medium text-purple-600">{location.totalBits}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/director/locations/${location._id}/edit`);
                    }}
                    className="w-full flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm font-medium"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    Edit Location
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

