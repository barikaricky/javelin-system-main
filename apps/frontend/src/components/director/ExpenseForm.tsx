import { useState } from 'react';
import { X, Upload, DollarSign, Calendar, MapPin, Tag, FileText, CreditCard, Hash } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { useNotificationStore } from '../../stores/notificationStore';
import { api } from '../../lib/api';

interface ExpenseFormProps {
  onClose: () => void;
  onSuccess: () => void;
  locations: Array<{ id: string; name: string; region?: string }>;
}

const EXPENSE_CATEGORIES = [
  'FUEL',
  'EQUIPMENT',
  'UNIFORM',
  'MAINTENANCE',
  'UTILITIES',
  'TRAINING',
  'PAYROLL',
  'TRANSPORT',
  'OTHER'
];

const PAYMENT_METHODS = [
  'CASH',
  'BANK_TRANSFER',
  'CHEQUE',
  'MOBILE_MONEY'
];

export default function ExpenseForm({ onClose, onSuccess, locations }: ExpenseFormProps) {
  const { addNotification } = useNotificationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipts, setReceipts] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  const [formData, setFormData] = useState({
    locationId: '',
    category: '',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    referenceNumber: '',
    notes: '',
  });

  const handleImageUpload = async (file: File) => {
    setIsCompressing(true);
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: 'image/jpeg',
      };

      const compressedFile = await imageCompression(file, options);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setReceipts(prev => [...prev, base64String]);
        
        addNotification({
          type: 'success',
          title: 'Receipt Uploaded',
          message: `Image compressed to ${(compressedFile.size / 1024).toFixed(0)}KB`,
        });
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to compress receipt image.',
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      }
    });
  };

  const removeReceipt = (index: number) => {
    setReceipts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.locationId || !formData.category || !formData.description || !formData.amount) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/expenses', {
        ...formData,
        amount: parseFloat(formData.amount),
        receipts,
      });

      addNotification({
        type: 'success',
        title: 'Expense Recorded',
        message: `Expense of ₦${formData.amount} has been recorded successfully`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed to Record Expense',
        message: error.message || 'An error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-dark-900 to-dark-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl sticky top-0 z-10">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
            Record New Expense
          </h2>
          <button onClick={onClose} className="text-white hover:text-primary-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Location */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gray-600" />
              Location <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.locationId}
              onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Select Location</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} {loc.region && `(${loc.region})`}
                </option>
              ))}
            </select>
          </div>

          {/* Category and Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Tag className="w-4 h-4 text-gray-600" />
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select Category</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-gray-600" />
                Amount (₦) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
              <FileText className="w-4 h-4 text-gray-600" />
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Describe the expense..."
              required
            />
          </div>

          {/* Date, Payment Method, Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-600" />
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.expenseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expenseDate: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <CreditCard className="w-4 h-4 text-gray-600" />
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select</option>
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>{method.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Hash className="w-4 h-4 text-gray-600" />
                Reference No.
              </label>
              <input
                type="text"
                value={formData.referenceNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="TXN123..."
              />
            </div>
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Upload Receipts (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <label className="cursor-pointer">
                <span className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  {isCompressing ? 'Compressing...' : 'Click to upload'} 
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                  disabled={isCompressing}
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB each</p>
            </div>

            {/* Receipt Previews */}
            {receipts.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                {receipts.map((receipt, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={receipt}
                      alt={`Receipt ${index + 1}`}
                      className="w-full h-20 object-cover rounded border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeReceipt(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={2}
              placeholder="Any additional information..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sticky bottom-0 bg-white pb-2 sm:pb-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary-400 to-primary-600 hover:from-primary-500 hover:to-primary-700 text-dark-900 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin"></div>
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5" />
                  <span>Record Expense</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
