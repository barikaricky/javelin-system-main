import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  Building2,
  Calendar,
  DollarSign,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Briefcase,
  Clock,
  User,
  CreditCard,
  Star,
} from 'lucide-react';
import api, { getImageUrl } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface Location {
  _id: string;
  locationName: string;
  city: string;
  state: string;
}

interface UserData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  passportPhoto?: string;
}

interface Supervisor {
  _id: string;
  employeeId: string;
  userId: UserData;
  locationId?: Location;
  role: 'SUPERVISOR' | 'GENERAL_SUPERVISOR';
  salary: number;
  startDate: string;
  passportPhoto?: string;
  bankName?: string;
  bankAccount?: string;
  nationalId?: string;
  previousExperience?: string;
  medicalFitness?: boolean;
  approvalStatus?: string;
  operatorsManaged?: number;
  bitsManaged?: number;
  createdAt: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  supervisors: number;
  generalSupervisors: number;
}

export default function AdminSupervisorsPage() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SUPERVISOR' | 'GENERAL_SUPERVISOR'>('ALL');
  const [expandedSupervisorId, setExpandedSupervisorId] = useState<string | null>(null);

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const fetchSupervisors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/supervisors/all');
      console.log('Supervisors response:', response.data);
      setSupervisors(response.data || []);
    } catch (error) {
      console.error('Failed to fetch supervisors:', error);
      toast.error('Failed to load supervisors data');
    } finally {
      setLoading(false);
    }
  };

  const filteredSupervisors = supervisors.filter((supervisor) => {
    const matchesSearch =
      searchQuery === '' ||
      `${supervisor.userId?.firstName} ${supervisor.userId?.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      supervisor.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supervisor.locationId?.locationName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && supervisor.userId?.isActive) ||
      (statusFilter === 'INACTIVE' && !supervisor.userId?.isActive);

    const matchesRole =
      roleFilter === 'ALL' || supervisor.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const stats: Stats = {
    total: supervisors.length,
    active: supervisors.filter((sup) => sup.userId?.isActive).length,
    inactive: supervisors.filter((sup) => !sup.userId?.isActive).length,
    supervisors: supervisors.filter((sup) => sup.role === 'SUPERVISOR').length,
    generalSupervisors: supervisors.filter((sup) => sup.role === 'GENERAL_SUPERVISOR').length,
  };

  const getSupervisorPhoto = (supervisor: Supervisor) => {
    return supervisor.passportPhoto || supervisor.userId?.passportPhoto;
  };

  const toggleExpand = (supervisorId: string) => {
    setExpandedSupervisorId(expandedSupervisorId === supervisorId ? null : supervisorId);
  };

  const getRoleColor = (role: string) => {
    if (role === 'GENERAL_SUPERVISOR') {
      return 'bg-purple-100 text-purple-700';
    }
    return 'bg-blue-100 text-blue-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          Supervisors Management
        </h1>
        <p className="text-gray-600">View and manage all security supervisors</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Supervisors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.supervisors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">General</p>
              <p className="text-2xl font-bold text-gray-900">{stats.generalSupervisors}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, employee ID, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="GENERAL_SUPERVISOR">General Supervisor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Supervisors List */}
      {filteredSupervisors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Supervisors Found</h3>
          <p className="text-gray-600">
            {searchQuery ? 'Try adjusting your search criteria' : 'No supervisors have been registered yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSupervisors.map((supervisor) => (
            <div
              key={supervisor._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Supervisor Header */}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Profile Photo */}
                  <div className="flex-shrink-0">
                    {getSupervisorPhoto(supervisor) ? (
                      <img
                        src={getImageUrl(getSupervisorPhoto(supervisor))}
                        alt="Supervisor"
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-gray-200">
                        <span className="text-blue-700 text-xl font-bold">
                          {supervisor.userId?.firstName?.[0]}{supervisor.userId?.lastName?.[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Supervisor Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {supervisor.userId?.firstName} {supervisor.userId?.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          {supervisor.employeeId}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getRoleColor(supervisor.role)}`}>
                          {supervisor.role === 'GENERAL_SUPERVISOR' ? 'General Supervisor' : 'Supervisor'}
                        </span>
                        {supervisor.userId?.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium whitespace-nowrap">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium whitespace-nowrap">
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="space-y-1">
                      {supervisor.locationId && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {supervisor.locationId.locationName} - {supervisor.locationId.city}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>Since {new Date(supervisor.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={() => toggleExpand(supervisor._id)}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      {expandedSupervisorId === supervisor._id ? 'Hide Details' : 'View Details'}
                      <UserCheck className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedSupervisorId === supervisor._id && (
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Contact Information */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Contact Information
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="text-sm text-gray-900 break-all">{supervisor.userId?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="text-sm text-gray-900">{supervisor.userId?.phone || 'N/A'}</p>
                          </div>
                        </div>
                        {supervisor.nationalId && (
                          <div className="flex items-start gap-2">
                            <CreditCard className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500">National ID</p>
                              <p className="text-sm text-gray-900">{supervisor.nationalId}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assignment Details */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                        Assignment
                      </h4>
                      <div className="space-y-2">
                        {supervisor.locationId ? (
                          <div className="flex items-start gap-2">
                            <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500">Location</p>
                              <p className="text-sm text-gray-900">
                                {supervisor.locationId.locationName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {supervisor.locationId.city}, {supervisor.locationId.state}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No location assigned</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Employment Details */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Employment
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">Start Date</p>
                            <p className="text-sm text-gray-900">
                              {new Date(supervisor.startDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">Salary</p>
                            <p className="text-sm text-gray-900">₦{supervisor.salary.toLocaleString()}</p>
                          </div>
                        </div>
                        {supervisor.medicalFitness !== undefined && (
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500">Medical Fitness</p>
                              <p className="text-sm text-gray-900">
                                {supervisor.medicalFitness ? 'Certified' : 'Pending'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Banking & Additional Info */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        Banking
                      </h4>
                      <div className="space-y-2">
                        {supervisor.bankName ? (
                          <>
                            <div className="flex items-start gap-2">
                              <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500">Bank Name</p>
                                <p className="text-sm text-gray-900">{supervisor.bankName}</p>
                              </div>
                            </div>
                            {supervisor.bankAccount && (
                              <div className="flex items-start gap-2">
                                <CreditCard className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-500">Account Number</p>
                                  <p className="text-sm text-gray-900">{supervisor.bankAccount}</p>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No banking information</p>
                          </div>
                        )}
                        {supervisor.previousExperience && (
                          <div className="flex items-start gap-2 pt-2 border-t border-gray-200">
                            <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500">Previous Experience</p>
                              <p className="text-sm text-gray-900">{supervisor.previousExperience}</p>
                            </div>
                          </div>
                        )}
                      </div>
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
