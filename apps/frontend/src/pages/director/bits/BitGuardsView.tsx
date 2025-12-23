import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import {
  ChevronDown,
  ChevronUp,
  Users,
  Building2,
  MapPin,
  Phone,
  Calendar,
  DollarSign,
  Shield,
  Search,
  Download,
  RefreshCw,
} from 'lucide-react';

interface Guard {
  _id: string;
  operatorId: {
    _id: string;
    employeeId: string;
    salary: number;
    userId: {
      firstName: string;
      lastName: string;
      phone: string;
      state: string;
      profilePhoto?: string;
    };
  };
  shiftType: string;
  startDate: string;
  status: string;
  supervisorId: {
    userId: {
      firstName: string;
      lastName: string;
    };
  };
}

interface Bit {
  _id: string;
  bitCode: string;
  bitName: string;
  clientId?: {
    clientName: string;
  };
  client?: {
    clientName: string;
  };
  locationId?: {
    _id: string;
    locationName: string;
    address: string;
    state: string;
    city: string;
  };
  location?: {
    _id: string;
    name: string;
    address: string;
    state: string;
    lga: string;
  };
  numberOfOperators: number;
  guards: Guard[];
}

export default function BitGuardsView() {
  const [bits, setBits] = useState<Bit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBits, setExpandedBits] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBitsWithGuards();
  }, []);

  const fetchBitsWithGuards = async () => {
    try {
      setRefreshing(true);
      const bitsResponse = await api.get('/bits');
      const bitsData = bitsResponse.data.bits || [];

      // Fetch guards for each BIT
      const bitsWithGuards = await Promise.all(
        bitsData.map(async (bit: any) => {
          try {
            const guardsResponse = await api.get(`/assignments/bits/${bit._id}/assignments?status=ACTIVE`);
            
            // Normalize location data - backend returns locationId when populated
            const location = bit.locationId ? {
              _id: bit.locationId._id,
              name: bit.locationId.locationName,
              address: bit.locationId.address,
              state: bit.locationId.state,
              lga: bit.locationId.city || bit.locationId.lga
            } : bit.location;
            
            // Normalize client data
            const client = bit.clientId || bit.client;
            
            return {
              ...bit,
              location,
              client,
              guards: guardsResponse.data.assignments || [],
            };
          } catch (error) {
            console.error(`Error fetching guards for BIT ${bit._id}:`, error);
            
            // Normalize even on error
            const location = bit.locationId ? {
              _id: bit.locationId._id,
              name: bit.locationId.locationName,
              address: bit.locationId.address,
              state: bit.locationId.state,
              lga: bit.locationId.city || bit.locationId.lga
            } : bit.location;
            
            return { 
              ...bit, 
              location,
              client: bit.clientId || bit.client,
              guards: [] 
            };
          }
        })
      );

      setBits(bitsWithGuards);
    } catch (error: any) {
      console.error('Error fetching BITs:', error);
      toast.error('Failed to load BIT data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleExpand = (bitId: string) => {
    const newExpanded = new Set(expandedBits);
    if (newExpanded.has(bitId)) {
      newExpanded.delete(bitId);
    } else {
      newExpanded.add(bitId);
    }
    setExpandedBits(newExpanded);
  };

  const filteredBits = bits.filter(
    (bit) =>
      bit.bitName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bit.bitCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bit.client?.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bit.location?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalGuards = bits.reduce((sum, bit) => sum + (bit.guards?.length || 0), 0);
  const totalBits = bits.length;
  const bitsWithGuards = bits.filter((b) => b.guards && b.guards.length > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading BIT intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">BIT Guards Intelligence</h1>
        <p className="text-gray-600 mt-1">Comprehensive view of guard deployments across all BITs</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total BITs</p>
              <p className="text-2xl font-bold text-gray-800">{totalBits}</p>
            </div>
            <Building2 className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">BITs with Guards</p>
              <p className="text-2xl font-bold text-green-600">{bitsWithGuards}</p>
            </div>
            <Shield className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Guards Deployed</p>
              <p className="text-2xl font-bold text-purple-600">{totalGuards}</p>
            </div>
            <Users className="w-10 h-10 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg Guards/BIT</p>
              <p className="text-2xl font-bold text-orange-600">
                {totalBits > 0 ? (totalGuards / totalBits).toFixed(1) : '0'}
              </p>
            </div>
            <Shield className="w-10 h-10 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by BIT name, code, client, or location..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={fetchBitsWithGuards}
            disabled={refreshing}
            className="flex items-center px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* BITs List */}
      {filteredBits.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No BITs found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search' : 'No BITs available'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBits.map((bit) => (
            <div key={bit._id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* BIT Header */}
              <div
                onClick={() => toggleExpand(bit._id)}
                className="p-4 cursor-pointer hover:bg-gray-50 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Building2 className="w-5 h-5 text-blue-600 mr-3" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{bit.bitName}</h3>
                        <p className="text-sm text-gray-600">
                          {bit.bitCode} • {bit.client?.clientName || 'No Client'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="font-medium text-gray-800">{bit.location?.name || 'N/A'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Guards Assigned</p>
                      <p className="font-medium text-gray-800">
                        {bit.guards?.length || 0} / {bit.numberOfOperators || 0}
                      </p>
                    </div>
                    {expandedBits.has(bit._id) ? (
                      <ChevronUp className="w-6 h-6 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Guard Details */}
              {expandedBits.has(bit._id) && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  {/* Location Details */}
                  <div className="mb-4 p-4 bg-white rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Location Details</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 text-gray-500 mr-2 mt-0.5" />
                        <div>
                          <p className="text-gray-600">Address:</p>
                          <p className="font-medium text-gray-800">{bit.location?.address || 'N/A'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600">State:</p>
                        <p className="font-medium text-gray-800">{bit.location?.state || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">LGA:</p>
                        <p className="font-medium text-gray-800">{bit.location?.lga || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Guards Table */}
                  {!bit.guards || bit.guards.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-600">No guards assigned to this BIT</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Guard Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Phone
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              State (Origin)
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Shift
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Start Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Salary
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {bit.guards.map((guard) => {
                            // Add null checks to prevent errors
                            const operator = guard?.operatorId;
                            const user = operator?.userId;
                            if (!operator || !user) return null;
                            
                            return (
                            <tr key={guard._id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mr-3">
                                    {user.profilePhoto ? (
                                      <img
                                        src={user.profilePhoto}
                                        alt={user.firstName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Users className="w-full h-full p-2 text-gray-400" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {user.firstName}{' '}
                                      {user.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {operator.employeeId}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-900">
                                  <Phone className="w-4 h-4 mr-1 text-gray-400" />
                                  {user.phone}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.state}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {guard.shiftType?.replace('_', ' ') || 'N/A'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                  {new Date(guard.startDate).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <div className="flex items-center">
                                  <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                                  ₦{operator.salary?.toLocaleString() || '0'}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {guard.status}
                                </span>
                              </td>
                            </tr>
                          );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
