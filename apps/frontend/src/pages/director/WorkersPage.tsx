import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Shield,
  UserCog,
  Briefcase,
  Building2,
  User,
  Hash,
  Eye,
  Edit,
  Trash2,
  X,
  Calendar,
  Save,
  AlertTriangle,
  ChevronRight,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getImageUrl } from '../../lib/api';

// Role configuration with icons and colors
const ROLE_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; Icon: any }> = {
  DIRECTOR: { label: 'Director', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', Icon: Shield },
  DEVELOPER: { label: 'Developer', color: 'text-indigo-700', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', Icon: UserCog },
  MANAGER: { label: 'Manager', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', Icon: Briefcase },
  GENERAL_SUPERVISOR: { label: 'General Supervisor', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', Icon: Users },
  SUPERVISOR: { label: 'Supervisor', color: 'text-teal-700', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', Icon: Users },
  OPERATOR: { label: 'Operator', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', Icon: Building2 },
  SECRETARY: { label: 'Secretary', color: 'text-pink-700', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', Icon: UserCog },
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  SUSPENDED: 'bg-red-100 text-red-700',
};

interface Personnel {
  id: string;
  employeeId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  status: string;
  profilePhoto: string | null;
  passportPhoto: string | null;
  createdAt: string;
  address?: string | null;
  dateOfBirth?: string | null;
  hireDate?: string | null;
  department?: string | null;
  supervisorId?: string | null;
  salary?: number | null;
  operators?: Personnel[];
}

interface DetailedPersonnel extends Personnel {
  supervisor?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
}

export default function WorkersPage() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [countsByRole, setCountsByRole] = useState<Record<string, number>>({});
  
  // Modal states
  const [selectedPerson, setSelectedPerson] = useState<DetailedPersonnel | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingOperators, setLoadingOperators] = useState(false);
  const [supervisorOperators, setSupervisorOperators] = useState<Personnel[]>([]);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: '',
    address: '',
  });

  // Fetch all personnel on mount
  useEffect(() => {
    fetchPersonnel();
  }, []);

  const fetchPersonnel = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '500'); // Get all users
      
      const response = await api.get(`/users/all?${params.toString()}`);
      setPersonnel(response.data.users || []);
      setCountsByRole(response.data.countsByRole || {});
    } catch (error: any) {
      console.error('Failed to fetch personnel:', error);
      toast.error(error.response?.data?.error || 'Failed to load personnel');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter personnel by search query and selected role
  const filteredPersonnel = personnel.filter(person => {
    const matchesSearch = searchQuery === '' || 
      `${person.firstName} ${person.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (person.employeeId && person.employeeId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = selectedRole === 'ALL' || person.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  // Group filtered personnel by role
  const groupedByRole = filteredPersonnel.reduce((acc: Record<string, Personnel[]>, person) => {
    const role = person.role;
    if (!acc[role]) acc[role] = [];
    acc[role].push(person);
    return acc;
  }, {});

  // Sort roles in order
  const roleOrder = ['DIRECTOR', 'DEVELOPER', 'MANAGER', 'GENERAL_SUPERVISOR', 'SUPERVISOR', 'OPERATOR', 'SECRETARY'];
  const sortedRoles = Object.keys(groupedByRole).sort((a, b) => {
    return roleOrder.indexOf(a) - roleOrder.indexOf(b);
  });

  const getTotalCount = () => {
    return Object.values(countsByRole).reduce((sum, count) => sum + count, 0);
  };

  // Open detail modal
  const handleViewPerson = async (person: Personnel) => {
    setSelectedPerson(person as DetailedPersonnel);
    setShowDetailModal(true);
    
    // If this is a supervisor, load their operators
    if (person.role === 'SUPERVISOR' || person.role === 'GENERAL_SUPERVISOR') {
      await loadSupervisorOperators(person.id);
    } else {
      setSupervisorOperators([]);
    }
  };

  // Load operators for a supervisor
  const loadSupervisorOperators = async (supervisorId: string) => {
    setLoadingOperators(true);
    try {
      const response = await api.get(`/users/supervisor/${supervisorId}/operators`);
      setSupervisorOperators(response.data.operators || []);
    } catch (error) {
      console.error('Failed to load operators:', error);
      setSupervisorOperators([]);
    } finally {
      setLoadingOperators(false);
    }
  };

  // Open edit modal
  const handleEditPerson = (person: Personnel) => {
    setSelectedPerson(person as DetailedPersonnel);
    setEditForm({
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      phone: person.phone || '',
      status: person.status,
      address: '',
    });
    setShowEditModal(true);
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!selectedPerson) return;
    
    setIsSaving(true);
    try {
      await api.put(`/users/${selectedPerson.id}`, editForm);
      toast.success('Personnel updated successfully');
      setShowEditModal(false);
      fetchPersonnel();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update personnel');
    } finally {
      setIsSaving(false);
    }
  };

  // Open delete confirmation
  const handleDeletePerson = (person: Personnel) => {
    setSelectedPerson(person as DetailedPersonnel);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!selectedPerson) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/users/${selectedPerson.id}`);
      toast.success('Personnel deleted successfully');
      setShowDeleteModal(false);
      setShowDetailModal(false);
      fetchPersonnel();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete personnel');
    } finally {
      setIsDeleting(false);
    }
  };

  // Personnel card component
  const PersonnelCard = ({ person }: { person: Personnel }) => {
    const roleConfig = ROLE_CONFIG[person.role] || { 
      label: person.role, 
      color: 'text-gray-700', 
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      Icon: User 
    };

    const photoUrl = getImageUrl(person.profilePhoto || person.passportPhoto);
    const isSupervisor = person.role === 'SUPERVISOR' || person.role === 'GENERAL_SUPERVISOR';

    return (
      <div 
        className={`bg-white rounded-xl border ${roleConfig.borderColor} p-4 hover:shadow-lg transition-all cursor-pointer group relative`}
        onClick={() => handleViewPerson(person)}
      >
        {/* Action Buttons - Show on hover */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={(e) => { e.stopPropagation(); handleViewPerson(person); }}
            className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleEditPerson(person); }}
            className="p-1.5 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDeletePerson(person); }}
            className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-start gap-4">
          {/* Profile Photo */}
          <div className="flex-shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={`${person.firstName} ${person.lastName}`}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.firstName + ' ' + person.lastName)}&background=random&size=64`;
                }}
              />
            ) : (
              <div className={`w-16 h-16 rounded-full ${roleConfig.bgColor} flex items-center justify-center`}>
                <span className={`text-xl font-semibold ${roleConfig.color}`}>
                  {person.firstName.charAt(0)}{person.lastName.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {person.firstName} {person.lastName}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[person.status] || 'bg-gray-100 text-gray-700'}`}>
                {person.status}
              </span>
            </div>

            {/* Role Badge */}
            <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${roleConfig.bgColor} ${roleConfig.color} mb-2`}>
              <roleConfig.Icon className="w-3 h-3" />
              {roleConfig.label}
            </div>

            {/* Email */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{person.email}</span>
            </div>

            {/* Phone */}
            {person.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{person.phone}</span>
              </div>
            )}

            {/* Employee ID */}
            {person.employeeId && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="font-mono">{person.employeeId}</span>
              </div>
            )}

            {/* Salary */}
            {person.salary != null && (
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium mt-1">
                <DollarSign className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>₦{person.salary.toLocaleString()}/month</span>
              </div>
            )}
          </div>
        </div>

        {/* View operators indicator for supervisors */}
        {isSupervisor && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Click to view operators</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-7 h-7" />
                All Personnel
              </h1>
              <p className="text-blue-100 mt-1">
                {getTotalCount()} employees in the company
              </p>
            </div>
            <button
              onClick={fetchPersonnel}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg font-medium hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Role Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-6">
            <button
              onClick={() => setSelectedRole('ALL')}
              className={`bg-white/10 backdrop-blur rounded-lg p-3 text-center transition-all ${
                selectedRole === 'ALL' ? 'ring-2 ring-white bg-white/20' : 'hover:bg-white/20'
              }`}
            >
              <div className="text-2xl font-bold">{getTotalCount()}</div>
              <div className="text-xs text-blue-100">All</div>
            </button>
            {roleOrder.map(role => {
              const config = ROLE_CONFIG[role];
              const count = countsByRole[role] || 0;
              if (count === 0) return null;
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`bg-white/10 backdrop-blur rounded-lg p-3 text-center transition-all ${
                    selectedRole === role ? 'ring-2 ring-white bg-white/20' : 'hover:bg-white/20'
                  }`}
                >
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-blue-100 truncate">{config?.label || role}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or employee ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading personnel...</p>
            </div>
          </div>
        ) : filteredPersonnel.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No personnel found</h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try a different search term' : 'No employees registered yet'}
            </p>
          </div>
        ) : selectedRole === 'ALL' ? (
          // Grouped view by role
          <div className="space-y-8">
            {sortedRoles.map(role => {
              const config = ROLE_CONFIG[role];
              const RoleIcon = config?.Icon || User;
              const persons = groupedByRole[role];

              return (
                <div key={role}>
                  {/* Role Header */}
                  <div className={`flex items-center gap-3 mb-4 p-3 rounded-lg ${config?.bgColor || 'bg-gray-50'}`}>
                    <RoleIcon className={`w-6 h-6 ${config?.color || 'text-gray-700'}`} />
                    <h2 className={`text-lg font-semibold ${config?.color || 'text-gray-700'}`}>
                      {config?.label || role}
                    </h2>
                    <span className="text-sm text-gray-500">({persons.length})</span>
                  </div>

                  {/* Personnel Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {persons.map(person => (
                      <PersonnelCard key={person.id} person={person} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Single role view
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPersonnel.map(person => (
                <PersonnelCard key={person.id} person={person} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedPerson && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Personnel Details</h2>
              <button
                onClick={() => { setShowDetailModal(false); setSupervisorOperators([]); }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-shrink-0">
                  {getImageUrl(selectedPerson.profilePhoto || selectedPerson.passportPhoto) ? (
                    <img
                      src={getImageUrl(selectedPerson.profilePhoto || selectedPerson.passportPhoto)!}
                      alt={`${selectedPerson.firstName} ${selectedPerson.lastName}`}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-2xl font-bold text-blue-600">
                        {selectedPerson.firstName.charAt(0)}{selectedPerson.lastName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedPerson.firstName} {selectedPerson.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm px-3 py-1 rounded-full ${ROLE_CONFIG[selectedPerson.role]?.bgColor || 'bg-gray-100'} ${ROLE_CONFIG[selectedPerson.role]?.color || 'text-gray-700'}`}>
                      {ROLE_CONFIG[selectedPerson.role]?.label || selectedPerson.role}
                    </span>
                    <span className={`text-sm px-3 py-1 rounded-full ${STATUS_COLORS[selectedPerson.status] || 'bg-gray-100 text-gray-700'}`}>
                      {selectedPerson.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Hash className="w-4 h-4" />
                    Employee ID
                  </div>
                  <p className="font-mono font-medium text-gray-900">
                    {selectedPerson.employeeId || 'Not assigned'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                  <p className="font-medium text-gray-900">{selectedPerson.email}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </div>
                  <p className="font-medium text-gray-900">{selectedPerson.phone || 'Not provided'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    Joined
                  </div>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedPerson.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Operators Section for Supervisors */}
              {(selectedPerson.role === 'SUPERVISOR' || selectedPerson.role === 'GENERAL_SUPERVISOR') && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-600" />
                    Operators Under This Supervisor
                  </h4>
                  {loadingOperators ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                  ) : supervisorOperators.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No operators assigned to this supervisor</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {supervisorOperators.map(operator => (
                        <div key={operator.id} className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-amber-700">
                              {operator.firstName.charAt(0)}{operator.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {operator.firstName} {operator.lastName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{operator.email}</p>
                          </div>
                          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[operator.status] || 'bg-gray-100 text-gray-700'}`}>
                            {operator.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t px-6 py-4 flex justify-between items-center bg-gray-50">
              <button
                onClick={() => { handleDeletePerson(selectedPerson); }}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => { setShowDetailModal(false); handleEditPerson(selectedPerson); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPerson && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Personnel</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="PENDING">Pending</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t px-6 py-4 flex justify-end gap-2 bg-gray-50">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPerson && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-6 py-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-xl font-bold">Confirm Delete</h2>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <span className="font-semibold">{selectedPerson.firstName} {selectedPerson.lastName}</span>?
              </p>
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                This action cannot be undone. All data associated with this personnel will be permanently removed.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="border-t px-6 py-4 flex justify-end gap-2 bg-gray-50">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Deleting...' : 'Delete Personnel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}