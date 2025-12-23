import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Plus, Edit, Trash2, Search, Building2, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { api, getApiBaseURL } from '../../../lib/api';

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

export const LocationsListPage = () => {
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
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterState) params.append('state', filterState);
      // Only add isActive filter if it's not 'all'
      if (filterActive !== 'all') {
        params.append('isActive', filterActive);
      }
      
      const API_URL = getApiBaseURL();
      const queryString = params.toString();
      const url = queryString ? `${API_URL}/api/locations?${queryString}` : `${API_URL}/api/locations`;
      
      console.log('Fetching locations with URL:', url);
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Locations response:', response.data);
      setLocations(response.data.locations || response.data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
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
      console.log('Stats response:', response.data);
      setStats(response.data || { total: 0, active: 0, totalBits: 0, byState: [] });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default stats on error
      setStats({ total: 0, active: 0, totalBits: 0, byState: [] });
    }
  };

  const getLocationTypeLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const handleDeleteLocation = async (id: string) => {
    if (confirm('Are you sure you want to delete this location?')) {
      try {
        const token = localStorage.getItem('token');
        const API_URL = getApiBaseURL();
        await axios.delete(`${API_URL}/api/locations/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLocations(locations.filter(location => location._id !== id));
        alert('Location deleted successfully');
      } catch (error) {
        console.error('Error deleting location:', error);
        alert('Failed to delete location');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Locations</h1>
              <p className="text-gray-600 mt-1">Manage all operational locations</p>
            </div>
            <Link
              to="/secretary/locations/create"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Location
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Locations</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <Building2 className="h-10 w-10 text-purple-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-600 mt-1">{stats.total - stats.active}</p>
                </div>
                <Building2 className="h-10 w-10 text-gray-400" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bits</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{stats.totalBits}</p>
                </div>
                <MapPin className="h-10 w-10 text-blue-600" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>

            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All States</option>
              {stats?.byState?.map((s, index) => (
                <option key={s._id || `state-${index}`} value={s._id || ''}>
                  {s._id || 'Unknown'} ({s.count})
                </option>
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
            <Building2 className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No locations found</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">Get started by creating your first location</p>
            <Link
              to="/secretary/locations/create"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-purple-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              Add Location
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto bg-white rounded-lg shadow-md">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location Name</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {locations.map(location => (
                    <tr key={location._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 text-sm font-medium text-gray-900">
                        {location.locationName}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        {location.address}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        {location.city}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        {location.state}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        {getLocationTypeLabel(location.locationType)}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          location.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {location.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/secretary/locations/${location._id}/edit`}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Edit className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteLocation(location._id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {locations.map(location => (
                <div key={location._id} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-base mb-1">
                        {location.locationName}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        location.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {location.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Link
                        to={`/secretary/locations/${location._id}/edit`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteLocation(location._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{location.address}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500">City:</span>
                        <span className="ml-1 text-gray-900 font-medium">{location.city}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">State:</span>
                        <span className="ml-1 text-gray-900 font-medium">{location.state}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-1 text-gray-900 font-medium">{getLocationTypeLabel(location.locationType)}</span>
                    </div>
                    {location.contactPerson && (
                      <div>
                        <span className="text-gray-500">Contact:</span>
                        <span className="ml-1 text-gray-900">{location.contactPerson}</span>
                        {location.contactPhone && (
                          <span className="ml-1 text-gray-600">({location.contactPhone})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
