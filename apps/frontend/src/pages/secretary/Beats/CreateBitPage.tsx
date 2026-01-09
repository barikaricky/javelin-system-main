import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Building2, Users, Clock, Calendar, FileText, Save, ArrowLeft, User } from 'lucide-react';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';

interface BitFormData {
  bitName: string;
  locationId: string;
  description: string;
  clientId: string;
  securityType: string[];
  numberOfOperators: number;
  shiftType: 'DAY' | 'NIGHT' | '24_HOURS' | 'ROTATING';
  startDate: string;
  endDate: string;
  supervisorId: string;
  specialInstructions: string;
}

interface Location {
  _id: string;
  locationName: string;
  city: string;
  state: string;
}

interface Client {
  _id: string;
  name: string;
}

interface Supervisor {
  _id: string;
  fullName: string;
}

const SECURITY_TYPES = [
  'Armed Guard',
  'Unarmed Guard',
  'Mobile Patrol',
  'CCTV Monitoring',
  'Access Control',
  'Fire Watch',
  'Event Security',
  'Executive Protection',
];

export const CreateBitPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<BitFormData>({
    bitName: '',
    locationId: '',
    description: '',
    clientId: '',
    securityType: [],
    numberOfOperators: 1,
    shiftType: 'DAY',
    startDate: '',
    endDate: '',
    supervisorId: '',
    specialInstructions: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [locationsRes, clientsRes, supervisorsRes] = await Promise.all([
        api.get('/locations?isActive=true'),
        api.get('/clients'),
        api.get('/supervisors?approvalStatus=APPROVED'),
      ]);

      setLocations(locationsRes.data.locations || locationsRes.data.data || []);
      setClients(clientsRes.data.clients || clientsRes.data.data || []);
      setSupervisors(supervisorsRes.data.supervisors || supervisorsRes.data.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load form data');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSecurityTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      securityType: prev.securityType.includes(type)
        ? prev.securityType.filter(t => t !== type)
        : [...prev.securityType, type]
    }));
    setErrors(prev => ({ ...prev, securityType: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.bitName.trim()) newErrors.bitName = 'Bit name is required';
    if (!formData.locationId) newErrors.locationId = 'Location is required';
    if (formData.securityType.length === 0) newErrors.securityType = 'Select at least one security type';
    if (formData.numberOfOperators < 1) newErrors.numberOfOperators = 'At least 1 operator required';
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        clientId: formData.clientId || undefined,
        supervisorId: formData.supervisorId || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        specialInstructions: formData.specialInstructions || undefined,
      };

      await api.post('/beats', payload);
      
      toast.success('Beat created successfully!');
      navigate('/secretary/beats');
    } catch (error: any) {
      console.error('Error creating bit:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create bit';
      toast.error(errorMessage);
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/secretary/beats')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Beats
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Create New Beat</h1>
          <p className="text-gray-600 mt-2">Add a new security post assignment</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {errors.submit}
            </div>
          )}

          {/* Beat Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bit Name *
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="bitName"
                value={formData.bitName}
                onChange={handleChange}
                placeholder="e.g., Main Gate Security Post"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.bitName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.bitName && <p className="mt-1 text-sm text-red-600">{errors.bitName}</p>}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                name="locationId"
                value={formData.locationId}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none ${
                  errors.locationId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a location</option>
                {locations.map(loc => (
                  <option key={loc._id} value={loc._id}>
                    {loc.locationName} - {loc.city}, {loc.state}
                  </option>
                ))}
              </select>
            </div>
            {errors.locationId && <p className="mt-1 text-sm text-red-600">{errors.locationId}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of this security post..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Security Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Security Types *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {SECURITY_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleSecurityTypeToggle(type)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    formData.securityType.includes(type)
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {errors.securityType && <p className="mt-1 text-sm text-red-600">{errors.securityType}</p>}
          </div>

          {/* Operators and Shift */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Operators *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  name="numberOfOperators"
                  value={formData.numberOfOperators}
                  onChange={handleChange}
                  min="1"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.numberOfOperators ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.numberOfOperators && <p className="mt-1 text-sm text-red-600">{errors.numberOfOperators}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shift Type *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  name="shiftType"
                  value={formData.shiftType}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                >
                  <option value="DAY">Day Shift</option>
                  <option value="NIGHT">Night Shift</option>
                  <option value="24_HOURS">24 Hours</option>
                  <option value="ROTATING">Rotating</option>
                </select>
              </div>
            </div>
          </div>

          {/* Client (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client (Optional)
            </label>
            <select
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select a client (optional)</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Supervisor (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supervisor (Optional)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                name="supervisorId"
                value={formData.supervisorId}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
              >
                <option value="">Assign supervisor (optional)</option>
                {supervisors.map(sup => (
                  <option key={sup._id} value={sup._id}>
                    {sup.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleChange}
                placeholder="Any special instructions or notes..."
                rows={4}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/secretary/beats')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Create Beat
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
