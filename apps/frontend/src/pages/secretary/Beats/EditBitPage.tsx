import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield, Building2, Users, Clock, Calendar, FileText, Save, ArrowLeft, User } from 'lucide-react';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';

interface BitFormData {
  beatName: string;
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
  isActive: boolean;
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

export const EditBitPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<BitFormData>({
    beatName: '',
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
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setFetchLoading(true);
      const [bitRes, locationsRes, clientsRes, supervisorsRes] = await Promise.all([
        api.get(`/beats/${id}`),
        api.get('/locations?isActive=true'),
        api.get('/clients'),
        api.get('/supervisors?approvalStatus=APPROVED'),
      ]);

      const bit = bitRes.data.bit;
      setFormData({
        beatName: bit.beatName || '',
        locationId: bit.locationId?._id || '',
        description: bit.description || '',
        clientId: bit.clientId?._id || '',
        securityType: bit.securityType || [],
        numberOfOperators: bit.numberOfOperators || 1,
        shiftType: bit.shiftType || 'DAY',
        startDate: bit.startDate ? new Date(bit.startDate).toISOString().split('T')[0] : '',
        endDate: bit.endDate ? new Date(bit.endDate).toISOString().split('T')[0] : '',
        supervisorId: bit.supervisorId?._id || '',
        specialInstructions: bit.specialInstructions || '',
        isActive: bit.isActive !== undefined ? bit.isActive : true,
      });

      setLocations(locationsRes.data.locations || locationsRes.data.data || []);
      setClients(clientsRes.data.clients || clientsRes.data.data || []);
      setSupervisors(supervisorsRes.data.supervisors || supervisorsRes.data.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load bit data');
      navigate('/secretary/beats');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
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

    if (!formData.beatName.trim()) newErrors.beatName = 'Beat name is required';
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

      await api.put(`/beats/${id}`, payload);
      
      toast.success('Beat updated successfully!');
      navigate('/secretary/beats');
    } catch (error: any) {
      console.error('Error updating bit:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update bit';
      toast.error(errorMessage);
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bit details...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Edit Beat</h1>
          <p className="text-gray-600 mt-2">Update security post assignment details</p>
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
              Beat Name *
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="beatName"
                value={formData.beatName}
                onChange={handleChange}
                placeholder="e.g., Main Gate Security Post"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.beatName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.beatName && <p className="mt-1 text-sm text-red-600">{errors.beatName}</p>}
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
                placeholder="Any special instructions or requirements..."
                rows={4}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
              Active Status (Check to make this bit active)
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/secretary/beats')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Update Beat
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
