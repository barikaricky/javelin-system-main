import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Users,
  Building2,
  MapPin,
  Clock,
  AlertCircle,
  Briefcase,
  Info,
} from 'lucide-react';

interface Operator {
  _id: string;
  employeeId: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    state: string;
    profilePhoto?: string;
    status: string;
  };
}

interface Bit {
  _id: string;
  bitCode: string;
  bitName: string;
  numberOfOperators: number;
  location: {
    _id: string;
    name: string;
    state: string;
  };
  client?: {
    clientName: string;
  };
}

export default function RequestAssignmentPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [bits, setBits] = useState<Bit[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [selectedBit, setSelectedBit] = useState<Bit | null>(null);
  const [supervisorId, setSupervisorId] = useState<string>('');

  const [formData, setFormData] = useState({
    operatorId: '',
    bitId: '',
    shiftType: 'DAY' as 'DAY' | 'NIGHT' | '24_HOURS' | 'ROTATING',
    startDate: new Date().toISOString().split('T')[0],
    assignmentType: 'PERMANENT' as 'PERMANENT' | 'TEMPORARY' | 'RELIEF',
    specialInstructions: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [operatorsRes, bitsRes, profileRes] = await Promise.all([
        api.get('/supervisor/my-operators'),
        api.get('/bits'),
        api.get('/supervisor/profile'),
      ]);

      // Filter only ACTIVE operators
      const activeOperators = (operatorsRes.data.operators || []).filter(
        (op: any) => op.userId?.status === 'ACTIVE'
      );
      setOperators(activeOperators);
      setBits(bitsRes.data.bits || []);
      setSupervisorId(profileRes.data.supervisor?._id || '');
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    }
  };

  const handleOperatorSelect = async (operatorId: string) => {
    setFormData({ ...formData, operatorId });
    const operator = operators.find((op) => op._id === operatorId);
    setSelectedOperator(operator || null);

    if (operatorId) {
      try {
        const response = await api.post(`/operators/${operatorId}/validate-eligibility`);
        if (!response.data.eligible) {
          toast.error(response.data.reason || 'Operator is not eligible for assignment');
        }
      } catch (error) {
        console.error('Error validating operator:', error);
      }
    }
  };

  const handleBitSelect = (bitId: string) => {
    setFormData({ ...formData, bitId });
    const bit = bits.find((b) => b._id === bitId);
    setSelectedBit(bit || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.operatorId || !formData.bitId || !supervisorId) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/assignments', {
        ...formData,
        supervisorId,
      });
      toast.success('Assignment request submitted - awaiting General Supervisor approval');
      navigate('/supervisor/assignments/pending');
    } catch (error: any) {
      console.error('Error submitting assignment request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit assignment request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/supervisor/operators')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Operators
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Request Operator Assignment</h1>
        <p className="text-gray-600 mt-1">Submit assignment request for approval</p>
      </div>

      {/* Approval Required Notice */}
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-yellow-500 mr-3 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Approval Required</p>
            <p className="text-sm text-yellow-700">
              Your assignment requests require General Supervisor approval before becoming active.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Select Operator */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Select Your Operator
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operator <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.operatorId}
                onChange={(e) => handleOperatorSelect(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- Select Operator --</option>
                {operators.map((operator) => (
                  <option key={operator._id} value={operator._id}>
                    {operator.userId.firstName} {operator.userId.lastName} ({operator.employeeId})
                  </option>
                ))}
              </select>
            </div>

            {selectedOperator && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-800 mb-3">Operator Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name:</p>
                    <p className="font-medium text-gray-800">
                      {selectedOperator.userId.firstName} {selectedOperator.userId.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Employee ID:</p>
                    <p className="font-medium text-gray-800">{selectedOperator.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone:</p>
                    <p className="font-medium text-gray-800">{selectedOperator.userId.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">State:</p>
                    <p className="font-medium text-gray-800">{selectedOperator.userId.state}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Select BIT */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Select BIT (Client Site)
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BIT <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.bitId}
                onChange={(e) => handleBitSelect(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- Select BIT --</option>
                {bits.map((bit) => (
                  <option key={bit._id} value={bit._id}>
                    {bit.bitName} ({bit.bitCode}) - {bit.client?.clientName || 'No Client'}
                  </option>
                ))}
              </select>
            </div>

            {selectedBit && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-800 mb-3">BIT Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <Building2 className="w-4 h-4 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-gray-600">Client:</p>
                      <p className="font-medium text-gray-800">
                        {selectedBit.client?.clientName || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-gray-600">Location:</p>
                      <p className="font-medium text-gray-800">
                        {selectedBit.location.name}, {selectedBit.location.state}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assignment Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Briefcase className="w-5 h-5 mr-2" />
            Assignment Details
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shift Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.shiftType}
                onChange={(e) => setFormData({ ...formData, shiftType: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="DAY">Day Shift</option>
                <option value="NIGHT">Night Shift</option>
                <option value="24_HOURS">24 Hours</option>
                <option value="ROTATING">Rotating Shifts</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Type</label>
              <select
                value={formData.assignmentType}
                onChange={(e) =>
                  setFormData({ ...formData, assignmentType: e.target.value as any })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="PERMANENT">Permanent</option>
                <option value="TEMPORARY">Temporary</option>
                <option value="RELIEF">Relief</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions (Optional)
            </label>
            <textarea
              value={formData.specialInstructions}
              onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
              rows={3}
              placeholder="Any special instructions for this assignment..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={500}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/supervisor/operators')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <Clock className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 mr-2" />
                Submit for Approval
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
