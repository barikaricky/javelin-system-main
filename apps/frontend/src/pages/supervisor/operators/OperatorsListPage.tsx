import { useState, useEffect } from 'react';
import { Users, Search, MapPin, Clock, Mail, Phone, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getImageUrl } from '../../../lib/api';

interface Operator {
  id: string;
  employeeId: string;
  salary: number;
  startDate: string;
  users: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profilePhoto: string | null;
    status: string;
  };
  locations: {
    name: string;
    address: string;
  } | null;
}

export default function OperatorsListPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      // This endpoint would need to be created to get supervisor's operators
      const response = await api.get('/supervisors/my-operators');
      setOperators(response.data.operators || []);
    } catch (error) {
      console.error('Error fetching operators:', error);
      toast.error('Failed to load operators');
    } finally {
      setLoading(false);
    }
  };

  const filteredOperators = operators.filter((op) =>
    `${op.users.firstName} ${op.users.lastName} ${op.users.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Operators</h1>
          <p className="text-gray-600 mt-1">Manage your assigned operators</p>
        </div>
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold">
          {operators.length} Total
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search operators..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Operators Grid */}
      {filteredOperators.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Operators Found</h3>
          <p className="text-gray-600">
            {searchTerm
              ? 'No operators match your search'
              : 'No operators have been assigned to you yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOperators.map((operator) => (
            <div
              key={operator.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                {/* Operator Info */}
                <div className="flex items-start gap-4 mb-4">
                  {operator.users.profilePhoto ? (
                    <img
                      src={getImageUrl(operator.users.profilePhoto)}
                      alt={`${operator.users.firstName} ${operator.users.lastName}`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold text-lg">
                      {operator.users.firstName[0]}
                      {operator.users.lastName[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {operator.users.firstName} {operator.users.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">{operator.employeeId}</p>
                    <span
                      className={`inline-flex items-center px-2 py-1 mt-1 rounded-full text-xs font-medium ${
                        operator.users.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : operator.users.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {operator.users.status}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={14} className="flex-shrink-0" />
                    <span className="truncate">{operator.users.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={14} className="flex-shrink-0" />
                    <span>{operator.users.phone}</span>
                  </div>
                  {operator.locations && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={14} className="flex-shrink-0" />
                      <span className="truncate">{operator.locations.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={14} className="flex-shrink-0" />
                    <span>
                      Since {new Date(operator.startDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
