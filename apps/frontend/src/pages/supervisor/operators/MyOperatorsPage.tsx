import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, CheckCircle, XCircle, Mail, Phone, MapPin, Briefcase, Plus, AlertCircle } from 'lucide-react';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';

interface Operator {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  employeeId: string;
  userId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    passportPhoto?: string;
  };
  locationId?: {
    _id: string;
    locationName: string;
  };
  shiftType: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  passportPhoto?: string;
  createdAt: string;
}

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

export default function MyOperatorsPage() {
  const navigate = useNavigate();
  const [allOperators, setAllOperators] = useState<Operator[]>([]);
  const [filteredOperators, setFilteredOperators] = useState<Operator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadOperators();
  }, []);

  const loadOperators = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/operators/my-operators');
      
      let operatorsData: Operator[] = [];
      
      if (Array.isArray(response.data)) {
        operatorsData = response.data;
      } else if (response.data.operators) {
        operatorsData = response.data.operators;
      } else if (response.data.data) {
        operatorsData = response.data.data;
      }
      
      console.log('Loaded operators:', operatorsData.length);
      setAllOperators(operatorsData);
      setFilteredOperators(operatorsData);
    } catch (error: any) {
      console.error('Failed to load operators:', error);
      toast.error('Failed to load operators');
      setAllOperators([]);
      setFilteredOperators([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = (filterType: FilterType) => {
    setActiveFilter(filterType);
    
    if (filterType === 'all') {
      setFilteredOperators(allOperators);
    } else {
      const filtered = allOperators.filter(
        op => op.approvalStatus === filterType.toUpperCase()
      );
      setFilteredOperators(filtered);
    }
  };

  const getOperatorInfo = (operator: Operator) => {
    return {
      firstName: operator.firstName || operator.userId?.firstName || 'N/A',
      lastName: operator.lastName || operator.userId?.lastName || '',
      email: operator.email || operator.userId?.email || 'No email',
      phone: operator.phone || operator.userId?.phone || 'No phone',
      photo: operator.passportPhoto || operator.userId?.passportPhoto,
      location: operator.locationId?.locationName || 'No location',
    };
  };

  const stats = {
    total: allOperators.length,
    pending: allOperators.filter(o => o.approvalStatus === 'PENDING').length,
    approved: allOperators.filter(o => o.approvalStatus === 'APPROVED').length,
    rejected: allOperators.filter(o => o.approvalStatus === 'REJECTED').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Operators</h1>
              <p className="text-gray-600">Manage and monitor your registered operators</p>
            </div>
            <button
              onClick={() => navigate('/supervisor/operators/register')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Register Operator
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Approved</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Operators
            </button>
            <button
              onClick={() => applyFilter('pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeFilter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => applyFilter('approved')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeFilter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => applyFilter('rejected')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Operators List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading operators...</p>
            </div>
          </div>
        ) : filteredOperators.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeFilter === 'all' ? 'No Operators Yet' : `No ${activeFilter} operators`}
              </h3>
              <p className="text-gray-600 mb-6">
                {activeFilter === 'all' 
                  ? 'Start by registering your first operator'
                  : `You don't have any ${activeFilter} operators at the moment`
                }
              </p>
              {activeFilter === 'all' && (
                <button
                  onClick={() => navigate('/supervisor/operators/register')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Register First Operator
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOperators.map((operator) => {
              const info = getOperatorInfo(operator);
              
              return (
                <div
                  key={operator._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Operator Header */}
                  <div className="flex items-start gap-4 mb-4">
                    {info.photo ? (
                      <img
                        src={info.photo}
                        alt={`${info.firstName} ${info.lastName}`}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                        {info.firstName.charAt(0)}{info.lastName.charAt(0)}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {info.firstName} {info.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{operator.employeeId}</p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          operator.approvalStatus === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : operator.approvalStatus === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {operator.approvalStatus === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                        {operator.approvalStatus === 'REJECTED' && <XCircle className="w-3 h-3" />}
                        {operator.approvalStatus === 'PENDING' && <Clock className="w-3 h-3" />}
                        {operator.approvalStatus}
                      </span>
                    </div>
                  </div>

                  {/* Operator Details */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 truncate">{info.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">{info.phone}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 truncate">{info.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 capitalize">
                        {operator.shiftType?.toLowerCase() || 'N/A'} Shift
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Registered {new Date(operator.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
