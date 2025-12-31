import { useState, useEffect } from 'react';
import { Shield, Search, CheckCircle, XCircle, Clock, Users, MapPin, Mail, Phone } from 'lucide-react';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';

interface GeneralSupervisor {
  _id: string;
  id: string;
  employeeId: string;
  fullName: string;
  supervisorType: string;
  regionAssigned: string;
  users?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: string;
    profilePhoto?: string;
  };
  _count?: {
    supervisors: number;
    operators: number;
  };
}

export default function GeneralSupervisorsListPage() {
  const [generalSupervisors, setGeneralSupervisors] = useState<GeneralSupervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchGeneralSupervisors();
  }, []);

  const fetchGeneralSupervisors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/supervisors');
      console.log('All supervisors response:', response.data);
      
      const supervisorsData = response.data.supervisors || response.data.data || response.data || [];
      const generalSups = Array.isArray(supervisorsData) 
        ? supervisorsData.filter((sup: GeneralSupervisor) => sup.supervisorType === 'GENERAL_SUPERVISOR')
        : [];
      
      setGeneralSupervisors(generalSups);
    } catch (error: any) {
      console.error('Failed to fetch general supervisors:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch general supervisors');
      setGeneralSupervisors([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
      ACTIVE: {
        label: 'Active',
        className: 'bg-green-100 text-green-700',
        icon: CheckCircle,
      },
      PENDING: {
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-700',
        icon: Clock,
      },
      SUSPENDED: {
        label: 'Suspended',
        className: 'bg-red-100 text-red-700',
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const filteredGeneralSupervisors = generalSupervisors.filter((gs) => {
    const matchesSearch = 
      gs.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gs.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gs.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gs.regionAssigned?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || gs.users?.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: generalSupervisors.length,
    active: generalSupervisors.filter(gs => gs.users?.status === 'ACTIVE').length,
    pending: generalSupervisors.filter(gs => gs.users?.status === 'PENDING').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-purple-600" />
            General Supervisors
          </h1>
          <p className="text-gray-600 mt-2">View all general supervisors and their information</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search general supervisors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {filteredGeneralSupervisors.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No general supervisors found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No general supervisors have been registered yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGeneralSupervisors.map((gs) => (
              <div
                key={gs._id || gs.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {gs.users?.profilePhoto ? (
                      <img
                        src={gs.users.profilePhoto}
                        alt={gs.fullName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-purple-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{gs.fullName}</h3>
                      <p className="text-sm text-gray-500">{gs.employeeId}</p>
                    </div>
                  </div>
                  {gs.users?.status && getStatusBadge(gs.users.status)}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{gs.users?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{gs.users?.phone || 'N/A'}</span>
                  </div>
                  {gs.regionAssigned && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{gs.regionAssigned}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  {gs._count?.supervisors !== undefined && (
                    <div>
                      <p className="text-xs text-gray-500">Supervisors</p>
                      <p className="text-sm font-medium text-gray-900">{gs._count.supervisors}</p>
                    </div>
                  )}
                  {gs._count?.operators !== undefined && (
                    <div>
                      <p className="text-xs text-gray-500">Operators</p>
                      <p className="text-sm font-medium text-gray-900">{gs._count.operators}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Region</p>
                    <p className="text-sm font-medium text-gray-900">{gs.regionAssigned || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
