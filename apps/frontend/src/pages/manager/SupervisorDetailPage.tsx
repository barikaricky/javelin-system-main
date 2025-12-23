import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  Shield,
  User,
  Clock,
  Building2,
  ChevronRight,
  RefreshCw,
  DollarSign,
  Home,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getImageUrl } from '../../lib/api';

interface SupervisorDetails {
  id: string;
  userId: string;
  employeeId: string;
  supervisorType: 'GENERAL_SUPERVISOR' | 'SUPERVISOR';
  regionAssigned: string | null;
  shiftType: string | null;
  approvalStatus: string;
  rejectionReason: string | null;
  createdAt: string;
  salary?: number;
  salaryCategory?: string;
  allowance?: number;
  users: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    status: string;
    profilePhoto: string | null;
    createdAt: string;
    state?: string;
    lga?: string;
    address?: string;
    gender?: string;
    dateOfBirth?: string;
  };
  locations?: {
    id: string;
    name: string;
    address: string;
  } | null;
  generalSupervisor?: {
    id: string;
    users: {
      firstName: string;
      lastName: string;
    };
  } | null;
  operatorCount?: number;
  subordinateSupervisorCount?: number;
}

interface Operator {
  id: string;
  employeeId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  profilePhoto: string | null;
}

interface SubordinateSupervisor {
  id: string;
  employeeId: string;
  users: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    status: string;
    profilePhoto: string | null;
  };
  operatorCount?: number;
}

export default function SupervisorDetailPage() {
  const { supervisorId } = useParams<{ supervisorId: string }>();
  const navigate = useNavigate();
  
  const [supervisor, setSupervisor] = useState<SupervisorDetails | null>(null);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [subordinates, setSubordinates] = useState<SubordinateSupervisor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingOperators, setLoadingOperators] = useState(false);

  useEffect(() => {
    if (supervisorId) {
      loadSupervisorDetails();
    }
  }, [supervisorId]);

  const loadSupervisorDetails = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Loading supervisor details for ID:', supervisorId);
      const response = await api.get(`/manager/supervisors/${supervisorId}`);
      console.log('✅ Supervisor data received:', response.data);
      setSupervisor(response.data.supervisor);
      
      // Load operators or subordinate supervisors based on type
      if (response.data.supervisor.supervisorType === 'SUPERVISOR') {
        await loadOperators(response.data.supervisor.userId);
      } else if (response.data.supervisor.supervisorType === 'GENERAL_SUPERVISOR') {
        await loadSubordinateSupervisors(response.data.supervisor.id);
      }
    } catch (error: any) {
      console.error('❌ Error loading supervisor details:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to load supervisor details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOperators = async (userId: string) => {
    setLoadingOperators(true);
    try {
      const response = await api.get(`/users/supervisor/${userId}/operators`);
      setOperators(response.data.operators || []);
    } catch (error) {
      console.error('Error loading operators:', error);
    } finally {
      setLoadingOperators(false);
    }
  };

  const loadSubordinateSupervisors = async (gsId: string) => {
    setLoadingOperators(true);
    try {
      const response = await api.get(`/manager/general-supervisor/${gsId}/supervisors`);
      setSubordinates(response.data.supervisors || []);
    } catch (error) {
      console.error('Error loading subordinate supervisors:', error);
    } finally {
      setLoadingOperators(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getApprovalBadge = (status: string | undefined) => {
    switch (status) {
      case 'APPROVED':
        return { class: 'bg-green-100 text-green-700 border-green-200', label: 'Approved' };
      case 'REJECTED':
        return { class: 'bg-red-100 text-red-700 border-red-200', label: 'Rejected' };
      case 'PENDING':
      default:
        return { class: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Pending Approval' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading supervisor details...</p>
        </div>
      </div>
    );
  }

  if (!supervisor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Users className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Supervisor Not Found</h2>
        <p className="text-gray-500 mb-4">The supervisor you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/manager/supervisors')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Back to Supervisors
        </button>
      </div>
    );
  }

  const isGeneralSupervisor = supervisor.supervisorType === 'GENERAL_SUPERVISOR';
  const photoUrl = getImageUrl(supervisor.users?.profilePhoto || supervisor.users?.passportPhoto);
  const approvalBadge = getApprovalBadge(supervisor.approvalStatus);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
        <button
          onClick={() => navigate('/manager/supervisors')}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Supervisors
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Photo */}
          <div className="flex-shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={`${supervisor.users.firstName} ${supervisor.users.lastName}`}
                className="w-24 h-24 rounded-full object-cover border-4 border-white/20"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/20">
                <span className="text-3xl font-bold">
                  {supervisor.users.firstName.charAt(0)}{supervisor.users.lastName.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {supervisor.users.firstName} {supervisor.users.lastName}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${approvalBadge.class}`}>
                {approvalBadge.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                isGeneralSupervisor ? 'bg-purple-100/20 text-white' : 'bg-blue-100/20 text-white'
              }`}>
                {isGeneralSupervisor ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                {isGeneralSupervisor ? 'General Supervisor' : 'Supervisor'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(supervisor.users.status)}`}>
                {supervisor.users.status}
              </span>
            </div>
            <p className="text-white/80 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              {supervisor.employeeId}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={loadSupervisorDetails}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <Mail className="w-4 h-4" />
            Email
          </div>
          <p className="font-medium text-gray-900">{supervisor.users.email}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <Phone className="w-4 h-4" />
            Phone
          </div>
          <p className="font-medium text-gray-900">{supervisor.users.phone || 'Not provided'}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <Calendar className="w-4 h-4" />
            Joined
          </div>
          <p className="font-medium text-gray-900">
            {new Date(supervisor.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {supervisor.regionAssigned && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <MapPin className="w-4 h-4" />
              Region Assigned
            </div>
            <p className="font-medium text-gray-900">{supervisor.regionAssigned}</p>
          </div>
        )}

        {supervisor.shiftType && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <Clock className="w-4 h-4" />
              Shift Type
            </div>
            <p className="font-medium text-gray-900 capitalize">{supervisor.shiftType.toLowerCase()}</p>
          </div>
        )}

        {supervisor.locations && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <Building2 className="w-4 h-4" />
              Assigned Location
            </div>
            <p className="font-medium text-gray-900">{supervisor.locations.name}</p>
            <p className="text-sm text-gray-500">{supervisor.locations.address}</p>
          </div>
        )}

        {supervisor.generalSupervisor && (
          <div className="bg-white rounded-xl border border-purple-200 bg-purple-50 p-5">
            <div className="flex items-center gap-2 text-purple-600 text-sm mb-2">
              <Shield className="w-4 h-4" />
              Reports To (General Supervisor)
            </div>
            <p className="font-medium text-gray-900">
              {supervisor.generalSupervisor.users.firstName} {supervisor.generalSupervisor.users.lastName}
            </p>
          </div>
        )}

        {supervisor.users?.state && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <MapPin className="w-4 h-4" />
              State
            </div>
            <p className="font-medium text-gray-900">{supervisor.users.state}</p>
          </div>
        )}

        {supervisor.users?.lga && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <MapPin className="w-4 h-4" />
              LGA
            </div>
            <p className="font-medium text-gray-900">{supervisor.users.lga}</p>
          </div>
        )}

        {supervisor.users?.address && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <Home className="w-4 h-4" />
              Address
            </div>
            <p className="font-medium text-gray-900">{supervisor.users.address}</p>
          </div>
        )}

        {supervisor.salary && (
          <div className="bg-white rounded-xl border border-green-200 bg-green-50 p-5">
            <div className="flex items-center gap-2 text-green-600 text-sm mb-2">
              <DollarSign className="w-4 h-4" />
              Monthly Salary
            </div>
            <p className="font-medium text-gray-900 text-xl">
              ₦{supervisor.salary.toLocaleString()}
            </p>
            {supervisor.salaryCategory && (
              <p className="text-sm text-gray-500">{supervisor.salaryCategory}</p>
            )}
            {supervisor.allowance && supervisor.allowance > 0 && (
              <p className="text-xs text-green-600 mt-1">
                + ₦{supervisor.allowance.toLocaleString()} allowance
              </p>
            )}
          </div>
        )}
      </div>

      {/* Rejection Reason if rejected */}
      {supervisor.approvalStatus === 'REJECTED' && supervisor.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h3 className="text-red-700 font-semibold mb-2">Rejection Reason</h3>
          <p className="text-red-600">{supervisor.rejectionReason}</p>
        </div>
      )}

      {/* Operators Section (for regular Supervisors) */}
      {!isGeneralSupervisor && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-amber-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              Operators Under This Supervisor
              <span className="text-sm font-normal text-gray-500">({operators.length})</span>
            </h3>
          </div>
          
          <div className="p-6">
            {loadingOperators ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
              </div>
            ) : operators.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No operators assigned to this supervisor</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {operators.map(operator => (
                  <div key={operator.id} className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      {getImageUrl(operator.profilePhoto) ? (
                        <img
                          src={getImageUrl(operator.profilePhoto)!}
                          alt={`${operator.firstName} ${operator.lastName}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-amber-700">
                          {operator.firstName.charAt(0)}{operator.lastName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {operator.firstName} {operator.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{operator.email}</p>
                      {operator.phone && (
                        <p className="text-xs text-gray-500">{operator.phone}</p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(operator.status)}`}>
                      {operator.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subordinate Supervisors Section (for General Supervisors) */}
      {isGeneralSupervisor && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Supervisors Under This General Supervisor
              <span className="text-sm font-normal text-gray-500">({subordinates.length})</span>
            </h3>
          </div>
          
          <div className="p-6">
            {loadingOperators ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : subordinates.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No supervisors assigned to this general supervisor</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {subordinates.map(sub => (
                  <div 
                    key={sub.id} 
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/manager/supervisors/${sub.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        {getImageUrl(sub.users.profilePhoto) ? (
                          <img
                            src={getImageUrl(sub.users.profilePhoto)!}
                            alt={`${sub.users.firstName} ${sub.users.lastName}`}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-semibold text-blue-700">
                            {sub.users.firstName.charAt(0)}{sub.users.lastName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {sub.users.firstName} {sub.users.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{sub.employeeId}</p>
                        <p className="text-xs text-amber-600 mt-1">
                          {sub.operatorCount || 0} operators assigned
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(sub.users.status)}`}>
                          {sub.users.status}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
