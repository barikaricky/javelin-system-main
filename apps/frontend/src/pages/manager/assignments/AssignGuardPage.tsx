import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getImageUrl } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Users, MapPin, Calendar, Clock, AlertTriangle, CheckCircle, Shield, Building2, User } from 'lucide-react';

interface Operator {
  _id: string;
  id: string;
  employeeId: string;
  fullName: string;
  users: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    state: string;
    lga?: string;
    profilePhoto?: string;
    passportPhoto?: string;
  };
  supervisor?: {
    id: string;
    users: {
      firstName: string;
      lastName: string;
    };
  };
  locations?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface Bit {
  _id: string;
  bitCode: string;
  bitName: string;
  client: {
    _id: string;
    clientName: string;
  };
  location: {
    _id: string;
    name: string;
    address: string;
    state: string;
  };
  numberOfOperators: number;
  shiftType: string;
  isActive: boolean;
}

interface Supervisor {
  _id: string;
  id: string;
  employeeId: string;
  fullName: string;
  users: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    profilePhoto?: string;
    passportPhoto?: string;
  };
  supervisorType: string;
  regionAssigned?: string;
}

export default function AssignGuardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bits, setBits] = useState<Bit[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<any[]>([]);

  const [selectedBitId, setSelectedBitId] = useState('');
  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');
  const [shiftType, setShiftType] = useState<'DAY' | 'NIGHT' | '24_HOURS' | 'ROTATING'>('DAY');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignmentType, setAssignmentType] = useState<'PERMANENT' | 'TEMPORARY' | 'RELIEF'>('PERMANENT');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const selectedBit = bits.find((b) => b._id === selectedBitId);
  const selectedOperator = operators.find((o) => o._id === selectedOperatorId);
  const bitCapacity = selectedBit ? activeAssignments.filter((a) => a.bitId === selectedBitId).length : 0;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedBitId) {
      fetchBitAssignments(selectedBitId);
    }
  }, [selectedBitId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bitsRes, operatorsRes, supervisorsRes] = await Promise.all([
        api.get('/bits'),
        api.get('/managers/operators?status=ACTIVE'),
        api.get('/managers/supervisors'),
      ]);

      console.log('📊 Fetched data:', {
        bits: bitsRes.data.bits?.length || 0,
        operators: operatorsRes.data.operators?.length || 0,
        supervisors: supervisorsRes.data.supervisors?.length || 0,
      });

      setBits(bitsRes.data.bits || []);
      setOperators(operatorsRes.data.operators || []);
      setSupervisors(supervisorsRes.data.supervisors || []);
    } catch (error: any) {
      console.error('❌ Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBitAssignments = async (bitId: string) => {
    try {
      const response = await api.get(`/assignments/bits/${bitId}/assignments?status=ACTIVE`);
      setActiveAssignments(response.data.assignments || []);
    } catch (error) {
      console.error('Error fetching BIT assignments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBitId || !selectedOperatorId || !selectedSupervisorId) {
      toast.error('Please select BIT, Operator, and Supervisor');
      return;
    }

    // Check if BIT is over capacity
    if (selectedBit && bitCapacity >= selectedBit.numberOfOperators) {
      const confirmed = window.confirm(
        `This BIT is at capacity (${bitCapacity}/${selectedBit.numberOfOperators}). Do you want to proceed?`
      );
      if (!confirmed) return;
    }

    setLoading(true);

    try {
      const response = await api.post('/assignments', {
        operatorId: selectedOperatorId,
        bitId: selectedBitId,
        supervisorId: selectedSupervisorId,
        shiftType,
        startDate,
        assignmentType,
        specialInstructions: specialInstructions || undefined,
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Guard assigned successfully!');
        setTimeout(() => navigate('/manager/assignments'), 1000);
      }
    } catch (error: any) {
      console.error('❌ Error creating assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to assign guard');
    } finally {
      setLoading(false);
    }
  };

  const getCapacityColor = () => {
    if (!selectedBit) return 'text-gray-600';
    const percentage = (bitCapacity / selectedBit.numberOfOperators) * 100;
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <button
          onClick={() => navigate('/manager/assignments')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Back to Assignments
        </button>
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Assign Guard to BIT</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Deploy security personnel to a BIT location</p>
          </div>
        </div>
      </div>

      {/* Auto-Approval Notice */}
      <div className="mb-4 sm:mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg sm:rounded-xl p-4 sm:p-5 flex items-start shadow-sm">
        <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
        </div>
        <div>
          <p className="text-blue-900 font-semibold text-base sm:text-lg">Auto-Approval Enabled</p>
          <p className="text-blue-700 text-xs sm:text-sm mt-1">
            As Manager, your assignments become <span className="font-semibold">ACTIVE immediately</span> without requiring approval.
          </p>
        </div>
      </div>

      {loading && !bits.length ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium text-sm sm:text-base">Loading data...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 md:space-y-8">
          {/* BIT Selection Section */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Select BIT Location</h2>
                <p className="text-xs sm:text-sm text-gray-600">Choose where the guard will be deployed</p>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                BIT Location <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBitId}
                onChange={(e) => setSelectedBitId(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 font-medium"
                required
              >
                <option value="">-- Select a BIT --</option>
                {bits
                  .filter((bit) => bit.isActive)
                  .map((bit) => (
                    <option key={bit._id} value={bit._id}>
                      {bit.bitCode} - {bit.bitName} • {bit.client?.clientName || 'N/A'}
                    </option>
                  ))}
              </select>
              
              {selectedBit && (
                <div className="mt-3 sm:mt-4 p-4 sm:p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg sm:rounded-xl border border-gray-200">
                  {/* Capacity Bar */}
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs sm:text-sm font-semibold text-gray-700">BIT Capacity Status</p>
                      <p className={`text-xs sm:text-sm font-bold ${getCapacityColor()}`}>
                        {bitCapacity} / {selectedBit.numberOfOperators}
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3 overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          bitCapacity >= selectedBit.numberOfOperators
                            ? 'bg-gradient-to-r from-red-500 to-red-600'
                            : bitCapacity >= selectedBit.numberOfOperators * 0.75
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                            : 'bg-gradient-to-r from-green-500 to-green-600'
                        }`}
                        style={{
                          width: `${Math.min((bitCapacity / selectedBit.numberOfOperators) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    {bitCapacity >= selectedBit.numberOfOperators && (
                      <div className="mt-2 sm:mt-3 flex items-start bg-orange-50 border border-orange-200 rounded-lg p-2 sm:p-3">
                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                        <p className="text-orange-800 text-xs sm:text-sm font-medium">
                          BIT is at full capacity. Assigning more guards may require client approval.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Location Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 font-medium mb-1">Location</p>
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm sm:text-base font-semibold text-gray-900">{selectedBit.location?.name}</p>
                          <p className="text-xs sm:text-sm text-gray-600">{selectedBit.location?.state}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{selectedBit.location?.address}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 font-medium mb-1">Client</p>
                      <div className="flex items-start">
                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm sm:text-base font-semibold text-gray-900">{selectedBit.client?.clientName || 'N/A'}</p>
                          <p className="text-xs sm:text-sm text-gray-600">Shift: {selectedBit.shiftType}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Operator Selection Section */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Select Operator</h2>
                <p className="text-xs sm:text-sm text-gray-600">Choose the guard to assign</p>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                Security Guard <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedOperatorId}
                onChange={(e) => setSelectedOperatorId(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 font-medium"
                required
                disabled={operators.length === 0}
              >
                <option value="">
                  {operators.length === 0 ? '⚠️ No eligible operators available' : '-- Select an Operator --'}
                </option>
                {operators.map((op) => (
                  <option key={op.id || op._id} value={op.id || op._id}>
                    {op.users.firstName} {op.users.lastName} • {op.employeeId} • {op.users.state}
                  </option>
                ))}
              </select>
              
              {selectedOperator && (
                <div className="mt-3 sm:mt-4 p-4 sm:p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg sm:rounded-xl border border-emerald-200">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0 overflow-hidden shadow-md border-2 border-white">
                      {selectedOperator.users.profilePhoto || selectedOperator.users.passportPhoto ? (
                        <img
                          src={getImageUrl(selectedOperator.users.profilePhoto || selectedOperator.users.passportPhoto)}
                          alt={selectedOperator.users.firstName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                        {selectedOperator.users.firstName} {selectedOperator.users.lastName}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium mb-2">{selectedOperator.employeeId}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-3">
                        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Contact</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{selectedOperator.users.phone}</p>
                          <p className="text-xs text-gray-600 truncate">{selectedOperator.users.email}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Location</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">{selectedOperator.users.state}</p>
                          {selectedOperator.users.lga && (
                            <p className="text-xs text-gray-600">{selectedOperator.users.lga}</p>
                          )}
                        </div>
                        {selectedOperator.supervisor && (
                          <div className="col-span-1 sm:col-span-2 bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Current Supervisor</p>
                            <p className="text-xs sm:text-sm font-medium text-gray-900">
                              {selectedOperator.supervisor.users.firstName} {selectedOperator.supervisor.users.lastName}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Details */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Assignment Details</h2>
                <p className="text-xs sm:text-sm text-gray-600">Configure shift and supervisor</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Supervisor Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Supervisor <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSupervisorId}
                  onChange={(e) => setSelectedSupervisorId(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="">-- Select Supervisor --</option>
                  {supervisors.map((sup) => (
                    <option key={sup.id || sup._id} value={sup.id || sup._id}>
                      {sup.users.firstName} {sup.users.lastName} • {sup.supervisorType}
                    </option>
                  ))}
                </select>
              </div>

              {/* Shift Type */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Shift Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value as any)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="DAY">☀️ Day Shift</option>
                  <option value="NIGHT">🌙 Night Shift</option>
                  <option value="24_HOURS">🔄 24 Hours</option>
                  <option value="ROTATING">🔃 Rotating</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              {/* Assignment Type */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Assignment Type</label>
                <select
                  value={assignmentType}
                  onChange={(e) => setAssignmentType(e.target.value as any)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="PERMANENT">📌 Permanent</option>
                  <option value="TEMPORARY">⏱️ Temporary</option>
                  <option value="RELIEF">🔄 Relief</option>
                </select>
              </div>

              {/* Special Instructions */}
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Special Instructions (Optional)
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Enter any special requirements, notes, or instructions for this assignment..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">Add specific requirements or notes for this deployment</p>
                  <p className="text-xs font-medium text-gray-600">{specialInstructions.length}/500</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/manager/assignments')}
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg sm:rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || operators.length === 0 || !selectedBitId || !selectedOperatorId || !selectedSupervisorId}
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  Assigning Guard...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  Assign Guard to BIT
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
