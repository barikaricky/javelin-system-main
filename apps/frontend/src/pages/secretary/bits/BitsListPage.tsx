import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, Search, MapPin, Users, Clock, Edit } from 'lucide-react';
import axios from 'axios';
import { getApiBaseURL } from '../../../lib/api';

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

interface BitStats {
  total: number;
  active: number;
  byShift: Array<{ _id: string; count: number }>;
}

export const BitsListPage = () => {
  const navigate = useNavigate();
  const [bits, setBits] = useState<Bit[]>([]);
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
      
      const API_URL = getApiBaseURL();
      const response = await axios.get(
        `${API_URL}/api/bits?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBits(response.data.bits || []);
    } catch (error) {
      console.error('Error fetching bits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = getApiBaseURL();
      const response = await axios.get(`${API_URL}/api/bits/stats`, {
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-purple-600" />
                Security Bits
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage all security posts</p>
            </div>
            <button
              onClick={() => navigate('/secretary/bits/create')}
              className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-purple-600 text-white rounded-xl text-sm sm:text-base font-medium hover:bg-purple-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              Add Bit
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-gradient-to-br from-white to-purple-50 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Bits</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="p-2 sm:p-3 bg-purple-100 rounded-xl">
                  <Shield className="h-6 w-6 sm:h-10 sm:w-10 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-green-50 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">Active</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded-xl">
                  <Shield className="h-6 w-6 sm:h-10 sm:w-10 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">Inactive</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-600 mt-1">{stats.total - stats.active}</p>
                </div>
                <div className="p-2 sm:p-3 bg-gray-100 rounded-xl">
                  <Shield className="h-6 w-6 sm:h-10 sm:w-10 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-blue-50 p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">Day Shift</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">
                    {stats.byShift.find(s => s._id === 'DAY')?.count || 0}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                  <Clock className="h-6 w-6 sm:h-10 sm:w-10 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm mb-6 border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search bits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Bits List */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="relative">
              <div className="animate-spin h-16 w-16 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
              <Shield className="absolute inset-0 m-auto h-8 w-8 text-purple-600 animate-pulse" />
            </div>
            <p className="mt-4 text-gray-600 animate-pulse">Loading security bits...</p>
          </div>
        ) : bits.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center transform transition-all duration-300 hover:scale-105">
            <div className="relative inline-block mb-4">
              <Shield className="h-16 w-16 sm:h-20 sm:w-20 text-gray-400 animate-pulse" />
              <div className="absolute inset-0 bg-purple-400 opacity-20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No bits found</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">Get started by creating your first security bit</p>
            <button
              onClick={() => navigate('/secretary/bits/create')}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-purple-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-purple-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              Add Bit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {bits.map((bit, index) => (
              <div
                key={bit._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 p-4 sm:p-6 transform hover:-translate-y-1 border border-gray-100 hover:border-purple-200"
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2.5 sm:p-3 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl shadow-sm flex-shrink-0">
                      <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {bit.bitName}
                      </h3>
                      <span className="text-xs text-gray-500 font-mono">{bit.bitCode}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 shadow-sm ${
                    bit.isActive 
                      ? 'bg-green-100 text-green-800 ring-1 ring-green-200' 
                      : 'bg-gray-100 text-gray-800 ring-1 ring-gray-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      bit.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                    }`}></span>
                    {bit.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {bit.description && (
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{bit.description}</p>
                )}

                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-600 bg-gray-50 rounded-lg p-2 transition-colors hover:bg-gray-100">
                    <MapPin className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    <span className="truncate">{bit.locationId.locationName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-blue-50 rounded-lg p-2">
                      <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{bit.numberOfOperators} Op(s)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-orange-50 rounded-lg p-2">
                      <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span className="truncate">{getShiftLabel(bit.shiftType)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {bit.securityType.slice(0, 3).map((type, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-50 text-purple-700 font-medium ring-1 ring-purple-100 transition-all hover:bg-purple-100"
                      >
                        {type}
                      </span>
                    ))}
                    {bit.securityType.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700 font-medium ring-1 ring-gray-200">
                        +{bit.securityType.length - 3}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/secretary/bits/${bit._id}/edit`);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Bit
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
