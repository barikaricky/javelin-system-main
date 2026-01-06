import { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Users,
  Shield,
  Phone,
  Mail,
  Calendar,
  Clock,
  DollarSign,
  Search,
  Filter,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getImageUrl } from '../../lib/api';

interface Operator {
  _id: string;
  userId: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profilePhoto?: string;
    passportPhoto?: string;
  };
  employeeId: string;
  isActive: boolean;
}

interface Supervisor {
  _id: string;
  userId: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profilePhoto?: string;
  };
  employeeId: string;
  role?: string;
}

interface Location {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  contactPerson?: string;
  contactPhone?: string;
  numberOfGuardsRequired?: number;
}

interface Bit {
  _id: string;
  bitId: string;
  name: string;
  description?: string;
  locationId: Location;
  supervisorId?: Supervisor;
  isActive: boolean;
  numberOfGuardsRequired: number;
  clientRate?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  operators?: Operator[];
}

export default function AdminBitsPage() {
  const [bits, setBits] = useState<Bit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [expandedBitId, setExpandedBitId] = useState<string | null>(null);

  useEffect(() => {
    fetchBits();
  }, []);

  const fetchBits = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/bits/all', {
        params: {
          includeOperators: true,
          includeSupervisor: true,
          includeLocation: true,
        }
      });
      setBits(response.data.bits || response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch bits:', error);
      toast.error('Failed to load BITs data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBits = bits.filter(bit => {
    const matchesSearch = searchQuery === '' || 
      bit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bit.bitId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bit.locationId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && bit.isActive) ||
      (statusFilter === 'INACTIVE' && !bit.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const toggleExpand = (bitId: string) => {
    setExpandedBitId(expandedBitId === bitId ? null : bitId);
  };

  const getOperatorPhoto = (operator: Operator) => {
    return operator.userId?.profilePhoto || operator.userId?.passportPhoto;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">BITs & Locations</h1>
        <p className="text-gray-600">View all Business Intelligence Teams and their locations</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by BIT name, ID, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{bits.length}</p>
            <p className="text-sm text-gray-600">Total BITs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{bits.filter(b => b.isActive).length}</p>
            <p className="text-sm text-gray-600">Active</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{bits.filter(b => !b.isActive).length}</p>
            <p className="text-sm text-gray-600">Inactive</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {bits.reduce((sum, bit) => sum + (bit.operators?.length || 0), 0)}
            </p>
            <p className="text-sm text-gray-600">Total Operators</p>
          </div>
        </div>
      </div>

      {/* BITs List */}
      {filteredBits.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No BITs Found</h3>
          <p className="text-gray-600">
            {searchQuery ? 'Try adjusting your search criteria' : 'No BITs have been created yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBits.map((bit) => (
            <div
              key={bit._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* BIT Header */}
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* BIT Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        bit.isActive ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Building2 className={`w-6 h-6 ${bit.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-900">{bit.name}</h3>
                          <span className="text-sm text-gray-500">({bit.bitId})</span>
                          {bit.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                              <XCircle className="w-3 h-3" />
                              Inactive
                            </span>
                          )}
                        </div>
                        {bit.description && (
                          <p className="text-sm text-gray-600 mt-1">{bit.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{bit.locationId?.name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>{bit.operators?.length || 0} / {bit.numberOfGuardsRequired} Operators</span>
                          </div>
                          {bit.clientRate && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span>₦{bit.clientRate.toLocaleString()}/month</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expand Button */}
                  <button
                    onClick={() => toggleExpand(bit._id)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-medium">View Details</span>
                    {expandedBitId === bit._id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedBitId === bit._id && (
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Location Details */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        Location Details
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500">Location Name</p>
                          <p className="text-sm font-medium text-gray-900">{bit.locationId?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Address</p>
                          <p className="text-sm text-gray-900">{bit.locationId?.address || 'N/A'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-gray-500">City</p>
                            <p className="text-sm text-gray-900">{bit.locationId?.city || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">State</p>
                            <p className="text-sm text-gray-900">{bit.locationId?.state || 'N/A'}</p>
                          </div>
                        </div>
                        {bit.locationId?.contactPerson && (
                          <div>
                            <p className="text-xs text-gray-500">Contact Person</p>
                            <p className="text-sm text-gray-900">{bit.locationId.contactPerson}</p>
                            {bit.locationId.contactPhone && (
                              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {bit.locationId.contactPhone}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Supervisor Details */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-600" />
                        Supervisor
                      </h4>
                      {bit.supervisorId ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            {bit.supervisorId.userId?.profilePhoto ? (
                              <img
                                src={getImageUrl(bit.supervisorId.userId.profilePhoto)}
                                alt="Supervisor"
                                className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-700 font-semibold">
                                  {bit.supervisorId.userId?.firstName?.[0]}{bit.supervisorId.userId?.lastName?.[0]}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {bit.supervisorId.userId?.firstName} {bit.supervisorId.userId?.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{bit.supervisorId.employeeId}</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span>{bit.supervisorId.userId?.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{bit.supervisorId.userId?.phone || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No supervisor assigned</p>
                        </div>
                      )}
                    </div>

                    {/* BIT Dates */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        Timeline
                      </h4>
                      <div className="space-y-2">
                        {bit.startDate && (
                          <div>
                            <p className="text-xs text-gray-500">Start Date</p>
                            <p className="text-sm text-gray-900">
                              {new Date(bit.startDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        )}
                        {bit.endDate && (
                          <div>
                            <p className="text-xs text-gray-500">End Date</p>
                            <p className="text-sm text-gray-900">
                              {new Date(bit.endDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500">Created</p>
                          <p className="text-sm text-gray-900 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(bit.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Operators */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Operators ({bit.operators?.length || 0})
                      </h4>
                      {bit.operators && bit.operators.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {bit.operators.map((operator) => (
                            <div
                              key={operator._id}
                              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              {getOperatorPhoto(operator) ? (
                                <img
                                  src={getImageUrl(getOperatorPhoto(operator))}
                                  alt="Operator"
                                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-700 text-sm font-semibold">
                                    {operator.userId?.firstName?.[0]}{operator.userId?.lastName?.[0]}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {operator.userId?.firstName} {operator.userId?.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{operator.employeeId}</p>
                              </div>
                              {operator.isActive ? (
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No operators assigned</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
