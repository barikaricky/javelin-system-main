import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  Phone,
  Shield,
  DollarSign,
  Calendar,
  User,
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';

interface Client {
  _id: string;
  clientName: string;
  companyName: string;
  email: string;
  phone: string;
  alternativePhone: string;
  address: string;
  securityType: string[];
  serviceType: string;
  numberOfGuards: number;
  monthlyPayment: number;
  assignedGuards: AssignedGuard[];
  contractStartDate: string;
  contractEndDate: string;
  contactPerson: string;
  contactPersonPhone: string;
  notes: string;
  status: string;
  createdAt: string;
}

interface AssignedGuard {
  _id: string;
  operatorId: {
    _id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
  };
  supervisorId?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  assignedDate: string;
  postType: string;
}

interface Operator {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
}

interface Supervisor {
  _id: string;
  firstName: string;
  lastName: string;
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [assignForm, setAssignForm] = useState({
    operatorId: '',
    supervisorId: '',
    postType: '',
  });

  useEffect(() => {
    fetchClient();
    fetchOperators();
    fetchSupervisors();
  }, [id]);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/clients/${id}`);
      setClient(response.data);
    } catch (error) {
      console.error('Error fetching client:', error);
      toast.error('Failed to load client details');
    } finally {
      setLoading(false);
    }
  };

  const fetchOperators = async () => {
    try {
      const response = await api.get('/operators?limit=100');
      setOperators(response.data.operators || response.data.data || []);
    } catch (error) {
      console.error('Error fetching operators:', error);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const response = await api.get('/supervisors?limit=100');
      setSupervisors(response.data.supervisors || response.data.data || []);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  };

  const handleAssignGuard = async () => {
    if (!assignForm.operatorId || !assignForm.postType) {
      toast.error('Please select an operator and post type');
      return;
    }

    try {
      await api.post(`/clients/${id}/assign-guard`, assignForm);
      toast.success('Guard assigned successfully');
      setShowAssignModal(false);
      setAssignForm({ operatorId: '', supervisorId: '', postType: '' });
      fetchClient();
    } catch (error: any) {
      console.error('Error assigning guard:', error);
      toast.error(error.response?.data?.message || 'Failed to assign guard');
    }
  };

  const handleRemoveGuard = async (operatorId: string) => {
    if (!confirm('Are you sure you want to remove this guard from the client?')) {
      return;
    }

    try {
      await api.delete(`/clients/${id}/remove-guard/${operatorId}`);
      toast.success('Guard removed successfully');
      fetchClient();
    } catch (error: any) {
      console.error('Error removing guard:', error);
      toast.error(error.response?.data?.message || 'Failed to remove guard');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Client not found</p>
        <button
          onClick={() => navigate('/secretary/clients')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/secretary/clients')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </button>
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.clientName}</h1>
              {client.companyName && (
                <p className="text-gray-600">{client.companyName}</p>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate(`/secretary/clients/edit/${client._id}`)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Contact Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <p className="font-medium text-gray-900">{client.phone}</p>
              </div>
              {client.alternativePhone && (
                <div>
                  <label className="text-sm text-gray-600">Alternative Phone</label>
                  <p className="font-medium text-gray-900">{client.alternativePhone}</p>
                </div>
              )}
              {client.email && (
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <p className="font-medium text-gray-900">{client.email}</p>
                </div>
              )}
              <div className="col-span-2">
                <label className="text-sm text-gray-600">Address</label>
                <p className="font-medium text-gray-900">{client.address}</p>
              </div>
              {client.contactPerson && (
                <>
                  <div>
                    <label className="text-sm text-gray-600">Contact Person</label>
                    <p className="font-medium text-gray-900">{client.contactPerson}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Contact Person Phone</label>
                    <p className="font-medium text-gray-900">{client.contactPersonPhone}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Service Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Service Type</label>
                <p className="font-medium text-gray-900">{client.serviceType}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <p>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      client.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {client.status}
                  </span>
                </p>
              </div>
              <div className="col-span-2">
                <label className="text-sm text-gray-600">Security Types</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {client.securityType.map((type) => (
                    <span
                      key={type}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Guards */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Assigned Guards ({client.assignedGuards?.length || 0} / {client.numberOfGuards})
              </h2>
              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Assign Guard
              </button>
            </div>

            {client.assignedGuards && client.assignedGuards.length > 0 ? (
              <div className="space-y-3">
                {client.assignedGuards.map((guard) => (
                  <div
                    key={guard._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {guard.operatorId.firstName} {guard.operatorId.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{guard.operatorId.phoneNumber}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {guard.postType}
                          </span>
                          {guard.supervisorId && (
                            <span className="text-xs text-gray-600">
                              Supervisor: {guard.supervisorId.firstName} {guard.supervisorId.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveGuard(guard.operatorId._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p>No guards assigned yet</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Payment Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Payment Info
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Monthly Payment</label>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(client.monthlyPayment)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Guards Required</label>
                <p className="text-xl font-semibold text-gray-900">{client.numberOfGuards}</p>
              </div>
            </div>
          </div>

          {/* Contract Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Contract Info
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Start Date</label>
                <p className="font-medium text-gray-900">{formatDate(client.contractStartDate)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">End Date</label>
                <p className="font-medium text-gray-900">{formatDate(client.contractEndDate)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Created</label>
                <p className="font-medium text-gray-900">{formatDate(client.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Guard Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Assign Guard to Client</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Operator <span className="text-red-500">*</span>
                </label>
                <select
                  value={assignForm.operatorId}
                  onChange={(e) => setAssignForm({ ...assignForm, operatorId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose an operator...</option>
                  {operators.map((op) => (
                    <option key={op._id} value={op._id}>
                      {op.firstName} {op.lastName} - {op.phoneNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Supervisor (Optional)
                </label>
                <select
                  value={assignForm.supervisorId}
                  onChange={(e) => setAssignForm({ ...assignForm, supervisorId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a supervisor...</option>
                  {supervisors.map((sup) => (
                    <option key={sup._id} value={sup._id}>
                      {sup.firstName} {sup.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Post Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={assignForm.postType}
                  onChange={(e) => setAssignForm({ ...assignForm, postType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose post type...</option>
                  <option value="Day Shift">Day Shift</option>
                  <option value="Night Shift">Night Shift</option>
                  <option value="24 Hours">24 Hours</option>
                  <option value="Event Security">Event Security</option>
                  <option value="Patrol">Patrol</option>
                </select>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignGuard}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Assign Guard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
