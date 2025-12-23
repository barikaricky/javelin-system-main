import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../../lib/api';

const CATEGORIES = [
  { value: 'LOGISTICS_TRANSPORTATION', label: 'Logistics & Transportation' },
  { value: 'EQUIPMENT_PURCHASE', label: 'Equipment Purchase' },
  { value: 'UNIFORM_GEAR', label: 'Uniform & Gear' },
  { value: 'OFFICE_OPERATIONS', label: 'Office Operations' },
  { value: 'UTILITIES', label: 'Utilities (Water, Electricity, Internet)' },
  { value: 'VENDOR_CONTRACTOR_PAYMENT', label: 'Vendor/Contractor Payment' },
  { value: 'MAINTENANCE_REPAIRS', label: 'Maintenance & Repairs' },
  { value: 'EMERGENCY_EXPENSE', label: 'Emergency Expense' },
  { value: 'REGULATORY_GOVERNMENT_FEES', label: 'Regulatory/Government Fees' },
  { value: 'TRAINING_CERTIFICATION', label: 'Training & Certification' },
  { value: 'MISCELLANEOUS', label: 'Miscellaneous' }
];

const BENEFICIARY_TYPES = [
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'CONTRACTOR', label: 'Contractor' },
  { value: 'SUPPLIER', label: 'Supplier' },
  { value: 'SERVICE_PROVIDER', label: 'Service Provider' },
  { value: 'GOVERNMENT_AGENCY', label: 'Government Agency' },
  { value: 'UTILITY_COMPANY', label: 'Utility Company' },
  { value: 'OTHER', label: 'Other' }
];

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'POS', label: 'POS' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' }
];

const RecordMoneyOut: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    purpose: '',
    beneficiaryType: '',
    beneficiaryName: '',
    beneficiaryAccount: '',
    beneficiaryBank: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    supportingDocument: ''
  });
  const [editReason, setEditReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Load existing record for edit
  React.useEffect(() => {
    if (isEditMode && id) {
      loadMoneyOut();
    }
  }, [id]);

  const loadMoneyOut = async () => {
    try {
      const response = await api.get(`/money-out/${id}`);
      const record = response.data.data;
      
      if (record.approvalStatus !== 'PENDING_APPROVAL') {
        toast.error('Cannot edit: Record already processed');
        navigate('/secretary/money-out');
        return;
      }
      
      setFormData({
        category: record.category,
        amount: record.amount.toString(),
        purpose: record.purpose,
        beneficiaryType: record.beneficiaryType,
        beneficiaryName: record.beneficiaryName,
        beneficiaryAccount: record.beneficiaryAccount || '',
        beneficiaryBank: record.beneficiaryBank || '',
        paymentDate: new Date(record.paymentDate).toISOString().split('T')[0],
        paymentMethod: record.paymentMethod,
        supportingDocument: record.supportingDocument || ''
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load record');
      navigate('/secretary/money-out');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, supportingDocument: reader.result as string }));
      toast.success('Document uploaded');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Comprehensive validation
    if (!formData.category) {
      toast.error('Please select an expense category');
      return;
    }

    // Validate amount
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (!formData.purpose || formData.purpose.trim().length < 10) {
      toast.error('Purpose must be at least 10 characters');
      return;
    }

    if (!formData.beneficiaryType) {
      toast.error('Please select beneficiary type');
      return;
    }

    if (!formData.beneficiaryName || formData.beneficiaryName.trim().length === 0) {
      toast.error('Beneficiary name is required');
      return;
    }

    if (!formData.paymentMethod) {
      toast.error('Please select payment method');
      return;
    }

    if (!formData.supportingDocument) {
      toast.error('Supporting document is required');
      return;
    }

    if (isEditMode && (!editReason || editReason.trim().length < 10)) {
      toast.error('Edit reason must be at least 10 characters');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        purpose: formData.purpose.trim(),
        beneficiaryType: formData.beneficiaryType,
        beneficiaryName: formData.beneficiaryName.trim(),
        beneficiaryAccount: formData.beneficiaryAccount?.trim() || undefined,
        beneficiaryBank: formData.beneficiaryBank?.trim() || undefined,
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        supportingDocument: formData.supportingDocument,
        ...(isEditMode && { reason: editReason.trim() })
      };

      if (isEditMode) {
        await api.put(`/money-out/${id}`, payload);
        toast.success('Money Out record updated successfully');
      } else {
        await api.post('/money-out', payload);
        toast.success('Money Out request created successfully');
      }

      // Navigate after brief delay to show success message
      setTimeout(() => {
        navigate('/secretary/money-out');
      }, 1000);
    } catch (error: any) {
      console.error('Money Out submission error:', error);
      
      const message = error.response?.data?.message || error.message || 'Operation failed';
      
      // Check for salary keyword errors
      if (message.toLowerCase().includes('salary') || message.includes('BLOCKED')) {
        toast.error('❌ SALARY PAYMENTS NOT ALLOWED IN MONEY OUT', { duration: 5000 });
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/secretary/money-out')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Money Out' : 'Record Money Out'}
          </h1>
        </div>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <AlertCircle className="text-yellow-600 mr-2" size={20} />
          <div>
            <p className="text-sm font-medium text-yellow-800">Operational Expenses Only</p>
            <p className="text-xs text-yellow-700 mt-1">
              This system is for non-salary operational expenses only (vendors, contractors, utilities, etc.).
              All salary/payroll payments are managed in a separate system.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expense Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select category</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Amount and Payment Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (₦) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date *
            </label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purpose / Description * (min 10 characters)
          </label>
          <textarea
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            required
            minLength={10}
            maxLength={500}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Detailed description of the expense..."
          />
          <p className="text-xs text-gray-500 mt-1">{formData.purpose.length}/500 characters</p>
        </div>

        {/* Beneficiary Type and Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beneficiary Type *
            </label>
            <select
              value={formData.beneficiaryType}
              onChange={(e) => setFormData({ ...formData, beneficiaryType: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select type</option>
              {BENEFICIARY_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beneficiary Name *
            </label>
            <input
              type="text"
              value={formData.beneficiaryName}
              onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Company or individual name"
            />
          </div>
        </div>

        {/* Bank Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number (Optional)
            </label>
            <input
              type="text"
              value={formData.beneficiaryAccount}
              onChange={(e) => setFormData({ ...formData, beneficiaryAccount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Account number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Name (Optional)
            </label>
            <input
              type="text"
              value={formData.beneficiaryBank}
              onChange={(e) => setFormData({ ...formData, beneficiaryBank: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Bank name"
            />
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method *
          </label>
          <select
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select method</option>
            {PAYMENT_METHODS.map(method => (
              <option key={method.value} value={method.value}>{method.label}</option>
            ))}
          </select>
        </div>

        {/* Supporting Document Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supporting Document * (Invoice/Receipt/Quote)
          </label>
          <div className="flex items-center space-x-3">
            <label className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600">
              <Upload size={18} className="mr-2" />
              <span>{formData.supportingDocument ? 'Change Document' : 'Upload Document'}</span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {formData.supportingDocument && (
              <span className="text-sm text-green-600">✓ Document uploaded</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">Max file size: 5MB. Formats: PDF, PNG, JPG</p>
        </div>

        {/* Edit Reason (Only for edit mode) */}
        {isEditMode && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Edit * (min 10 characters)
            </label>
            <textarea
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              required
              minLength={10}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Explain why you are making this edit..."
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/secretary/money-out')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={18} className="mr-2" />
            {loading ? 'Saving...' : isEditMode ? 'Update Record' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecordMoneyOut;
