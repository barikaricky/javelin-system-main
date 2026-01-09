import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Search, MapPin, Users, Clock, Edit, Eye } from 'lucide-react';
import axios from 'axios';
import { getApiBaseURL } from '../../../lib/api';

interface Beat {
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

interface BitStats {
  total: number;
  active: number;
  byShift: Array<{ _id: string; count: number }>;
}

export const ManagerBitsListPage = () => {
  const navigate = useNavigate();
  const [beats, setBits] = useState<Beat[]>([]);
  const [stats, setStats] = useState<BitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');

  const API_URL = getApiBaseURL();

  useEffect(() => {
    fetchBits();
    fetchStats();
  }, [searchQuery, filterActive]);

  const fetchBits = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterActive !== 'all') params.append('isActive', filterActive);
      
      const response = await axios.get(
        `${API_URL}/api/beats?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBits(response.data.beats || []);
    } catch (error) {
      console.error('Error fetching beats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/beats/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Security Beats Overview</h1>
            <p className="text-gray-600 mt-1">View all security posts and their statistics</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Beats</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <Shield className="h-10 w-10 text-purple-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
                </div>
                <Shield className="h-10 w-10 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-600 mt-1">{stats.total - stats.active}</p>
                </div>
                <Shield className="h-10 w-10 text-gray-400" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Day Shift</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {stats.byShift.find(s => s._id === 'DAY')?.count || 0}
                  </p>
                </div>
                <Clock className="h-10 w-10 text-blue-600" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search beats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              aria-label="Filter by status"
              title="Filter by status"
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Beats List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
          </div>
        ) : beats.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No beats found</h3>
            <p className="text-gray-600">No security beats match your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beats.map(bit => (
              <div
                key={bit._id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Shield className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {bit.bitName}
                      </h3>
                      <span className="text-xs text-gray-500 font-mono">{bit.bitCode}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    bit.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {bit.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {bit.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{bit.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{bit.locationId.locationName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{bit.numberOfOperators} Operator(s)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{getShiftLabel(bit.shiftType)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-1 mb-3">
                    {bit.securityType.slice(0, 3).map((type, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-50 text-purple-700"
                      >
                        {type}
                      </span>
                    ))}
                    {bit.securityType.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                        +{bit.securityType.length - 3} more
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/manager/beats/${bit._id}/details`);
                      }}
                      className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 text-xs sm:text-sm font-medium shadow-sm"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      Details
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/manager/beats/${bit._id}/edit`);
                      }}
                      className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all transform hover:scale-105 text-xs sm:text-sm font-medium shadow-sm"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

