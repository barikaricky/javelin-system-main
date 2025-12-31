import { useState, useEffect } from 'react';
import { UserPlus, MapPin, Grid3x3, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';

interface Operator {
  _id: string;
  id: string;
  employeeId: string;
  fullName: string;
}

interface Location {
  _id: string;
  id: string;
  name: string;
  address: string;
}

interface Bit {
  _id: string;
  id: string;
  name: string;
  description: string;
  locationId: string;
}

export default function AssignOperatorPage() {
  const navigate = useNavigate();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [bits, setBits] = useState<Bit[]>([]);
  const [filteredBits, setFilteredBits] = useState<Bit[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    operatorId: '',
    locationId: '',
    bitId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.locationId) {
      const filtered = bits.filter(bit => bit.locationId === formData.locationId);
      setFilteredBits(filtered);
      if (formData.bitId && !filtered.find(b => b._id === formData.bitId)) {
        setFormData(prev => ({ ...prev, bitId: '' }));
      }
    } else {
      setFilteredBits([]);
      setFormData(prev => ({ ...prev, bitId: '' }));
    }
  }, [formData.locationId, bits]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [operatorsRes, locationsRes, bitsRes] = await Promise.all([
        api.get('/secretaries/operators'),
        api.get('/locations'),
        api.get('/bits'),
      ]);

      const operatorsData = operatorsRes.data.operators || operatorsRes.data.data || operatorsRes.data || [];
      const locationsData = locationsRes.data.locations || locationsRes.data.data || locationsRes.data || [];
      const bitsData = bitsRes.data.bits || bitsRes.data.data || bitsRes.data || [];

      setOperators(Array.isArray(operatorsData) ? operatorsData : []);
      setLocations(Array.isArray(locationsData) ? locationsData : []);
      setBits(Array.isArray(bitsData) ? bitsData : []);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.operatorId || !formData.locationId || !formData.bitId) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      
      await api.post('/assignments/assign', {
        operatorId: formData.operatorId,
        locationId: formData.locationId,
        bitId: formData.bitId,
      });

      toast.success('Operator assigned successfully!');
      
      setFormData({
        operatorId: '',
        locationId: '',
        bitId: '',
      });
      
    } catch (error: any) {
      console.error('Failed to assign operator:', error);
      toast.error(error.response?.data?.message || 'Failed to assign operator');
    } finally {
      setSubmitting(false);
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
        <button
          onClick={() => navigate('/secretary')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <UserPlus className="h-8 w-8 text-purple-600" />
              Assign Operator
            </h1>
            <p className="text-gray-600 mt-2">Assign an operator to a location and bit</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Select Operator
                </div>
              </label>
              <select
                value={formData.operatorId}
                onChange={(e) => setFormData({ ...formData, operatorId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Choose an operator...</option>
                {operators.map((operator) => (
                  <option key={operator._id || operator.id} value={operator._id || operator.id}>
                    {operator.fullName} ({operator.employeeId})
                  </option>
                ))}
              </select>
              {operators.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">No operators available</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Select Location
                </div>
              </label>
              <select
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Choose a location...</option>
                {locations.map((location) => (
                  <option key={location._id || location.id} value={location._id || location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
              {locations.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">No locations available</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Grid3x3 className="h-4 w-4" />
                  Select Bit
                </div>
              </label>
              <select
                value={formData.bitId}
                onChange={(e) => setFormData({ ...formData, bitId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!formData.locationId}
                required
              >
                <option value="">Choose a bit...</option>
                {filteredBits.map((bit) => (
                  <option key={bit._id || bit.id} value={bit._id || bit.id}>
                    {bit.name}
                  </option>
                ))}
              </select>
              {!formData.locationId && (
                <p className="text-sm text-gray-500 mt-1">Please select a location first</p>
              )}
              {formData.locationId && filteredBits.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">No bits available for this location</p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/secretary')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.operatorId || !formData.locationId || !formData.bitId}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Assign Operator
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Assignment Info</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Select an operator from the list of registered operators</li>
              <li>• Choose the location where the operator will be assigned</li>
              <li>• Select a specific bit within the chosen location</li>
              <li>• The operator will be notified of their assignment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
