import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Eye, Clock, CheckCircle, XCircle, Mail, Phone, MapPin, Briefcase, Plus, AlertCircle } from 'lucide-react';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';

interface Operator {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeId: string;
  locationId: {
    _id: string;
    locationName: string;
  };
  shiftType: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  passportPhoto?: string;
  createdAt: string;
}

export default function MyOperatorsPage() {
  const navigate = useNavigate();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    fetchMyOperators();
  }, [filter]);

  const fetchMyOperators = async () => {
    setLoading(true);
    try {
      const response = await api.get('/operators/my-operators');
      let data = response.data.operators || [];
      
      // Filter based on selection
      if (filter !== 'all') {
        data = data.filter((op: Operator) => 
          op.approvalStatus === filter.toUpperCase()
        );
      }
      
      setOperators(data);
    } catch (error: any) {
      console.error('Error fetching operators:', error);
      toast.error(error.response?.data?.message || 'Failed to load operators');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              My Operators
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Operators you have registered and their approval status
            </p>
          </div>
          <button
            onClick={() => navigate('/supervisor/operators/register')}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Register New Operator
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 animate-slide-up overflow-x-auto">
          <div className="flex gap-2 min-w-max sm:min-w-0">
            {[
              { key: 'all', label: 'All', icon: Users },
              { key: 'pending', label: 'Pending', icon: Clock },
              { key: 'approved', label: 'Approved', icon: CheckCircle },
              { key: 'rejected', label: 'Rejected', icon: XCircle },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm whitespace-nowrap ${
                  filter === tab.key
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Pending', count: operators.filter(o => o.approvalStatus === 'PENDING').length, color: 'from-yellow-500 to-orange-500', icon: Clock },
            { label: 'Approved', count: operators.filter(o => o.approvalStatus === 'APPROVED').length, color: 'from-green-500 to-emerald-500', icon: CheckCircle },
            { label: 'Rejected', count: operators.filter(o => o.approvalStatus === 'REJECTED').length, color: 'from-red-500 to-pink-500', icon: XCircle },
            { label: 'Total', count: operators.length, color: 'from-blue-500 to-indigo-500', icon: Users },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm p-6 transform hover:scale-105 transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.count}</p>
                </div>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${stat.color} flex items-center justify-center text-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Operators List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : operators.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center animate-fade-in">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No operators found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'pending' ? 'No pending registrations at the moment' : `No ${filter} operators found`}
            </p>
            <button
              onClick={() => navigate('/supervisor/operators/register')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Register Your First Operator
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {operators.map((operator, index) => (
              <div
                key={operator._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden transform hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {operator.passportPhoto ? (
                        <img
                          src={operator.passportPhoto}
                          alt={`${operator.firstName} ${operator.lastName}`}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-blue-100"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold">
                          {operator.firstName.charAt(0)}{operator.lastName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          {operator.firstName} {operator.lastName}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">{operator.employeeId}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(operator.approvalStatus)}`}>
                      {getStatusIcon(operator.approvalStatus)}
                      {operator.approvalStatus}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{operator.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{operator.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="truncate">{operator.locationId?.locationName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Briefcase className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <span>{operator.shiftType}</span>
                    </div>
                  </div>

                  {/* Registration Date */}
                  <div className="text-xs text-gray-500 pt-4 border-t border-gray-100">
                    Registered on {new Date(operator.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
