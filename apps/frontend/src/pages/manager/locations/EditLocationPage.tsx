import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Building2, Phone, User, FileText, Save, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { CityAutocomplete } from '../../../components/common/CityAutocomplete';
import { getApiBaseURL } from '../../../lib/api';

interface LocationFormData {
  locationName: string;
  city: string;
  state: string;
  lga: string;
  address: string;
  locationType: 'OFFICE' | 'WAREHOUSE' | 'CLIENT_SITE' | 'OPERATIONAL_BASE' | 'OTHER';
  contactPerson: string;
  contactPhone: string;
  notes: string;
  isActive: boolean;
}

export const ManagerEditLocationPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<LocationFormData>({
    locationName: '',
    city: '',
    state: '',
    lga: '',
    address: '',
    locationType: 'OPERATIONAL_BASE',
    contactPerson: '',
    contactPhone: '',
    notes: '',
    isActive: true,
  });

  useEffect(() => {
    fetchLocation();
  }, [id]);

  const fetchLocation = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = getApiBaseURL();
      const response = await axios.get(`${API_URL}/api/locations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const location = response.data.location;
      setFormData({
        locationName: location.locationName || '',
        city: location.city || '',
        state: location.state || '',
        lga: location.lga || '',
        address: location.address || '',
        locationType: location.locationType || 'OPERATIONAL_BASE',
        contactPerson: location.contactPerson || '',
        contactPhone: location.contactPhone || '',
        notes: location.notes || '',
        isActive: location.isActive !== undefined ? location.isActive : true,
      });
    } catch (error) {
      console.error('Error fetching location:', error);
      setErrors({ submit: 'Failed to load location data' });
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (city: { name: string; state: string }) => {
    setFormData(prev => ({
      ...prev,
      city: city.name,
      state: city.state,
    }));
    setErrors(prev => ({ ...prev, city: '', state: '' }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.locationName.trim()) newErrors.locationName = 'Location name is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (formData.contactPhone && !/^\+?[\d\s-()]+$/.test(formData.contactPhone)) {
      newErrors.contactPhone = 'Invalid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = getApiBaseURL();
      await axios.put(`${API_URL}/api/locations/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      navigate('/manager/locations');
    } catch (error: any) {
      console.error('Error updating location:', error);
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({ submit: 'Failed to update location' });
      }
    } finally {
      setSaving(false);
    }
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
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/manager/locations')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Locations
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Edit Location</h1>
          <p className="text-gray-600 mt-2">Update operational location information</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {errors.submit}
            </div>
          )}

          {/* Location Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location Name *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="locationName"
                value={formData.locationName}
                onChange={handleChange}
                placeholder="e.g., Port Harcourt Main Office"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.locationName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.locationName && <p className="mt-1 text-sm text-red-600">{errors.locationName}</p>}
          </div>

          {/* City Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <CityAutocomplete
              value={formData.city ? `${formData.city}, ${formData.state}` : ''}
              onCitySelect={handleCitySelect}
              placeholder="Type to search cities... (e.g., 'port' for Port Harcourt)"
              error={errors.city}
            />
          </div>

          {/* LGA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Local Government Area (LGA)
            </label>
            <input
              type="text"
              name="lga"
              value={formData.lga}
              onChange={handleChange}
              placeholder="e.g., Port Harcourt Municipality"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address *
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter the full street address"
              rows={3}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
          </div>

          {/* Location Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location Type *
            </label>
            <select
              name="locationType"
              value={formData.locationType}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="OPERATIONAL_BASE">Operational Base</option>
              <option value="OFFICE">Office</option>
              <option value="WAREHOUSE">Warehouse</option>
              <option value="CLIENT_SITE">Client Site</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Contact Person */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="Name of site contact"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="+234 xxx xxx xxxx"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.contactPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.contactPhone && <p className="mt-1 text-sm text-red-600">{errors.contactPhone}</p>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional information about this location..."
                rows={4}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/manager/locations')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Update Location
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

