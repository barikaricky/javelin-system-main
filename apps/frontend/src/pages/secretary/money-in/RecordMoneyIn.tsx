import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  DollarSign, Calendar, Upload, FileText, Building2, 
  Receipt, CreditCard, Banknote, Plus, X, AlertCircle 
} from 'lucide-react';
import { api } from '../../../lib/api';

interface Client {
  _id: string;
  clientName: string;
  companyName?: string;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  paidAmount?: number;
  clientId: string;
}

export default function RecordMoneyIn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  
  const [formData, setFormData] = useState({
    amount: '',
    transactionDate: new Date().toISOString().split('T')[0],
    source: 'CLIENT' as 'CLIENT' | 'INVOICE' | 'STAFF' | 'ASSET_SALE' | 'LOAN' | 'CAPITAL_INJECTION' | 'MISCELLANEOUS',
    paymentMethod: 'CASH' as 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'MOBILE_MONEY' | 'POS' | 'OTHER',
    description: '',
    clientId: '',
    invoiceId: '',
    referenceNumber: '',
    receiptNumber: '',
    bankName: '',
    accountNumber: '',
    notes: '',
    category: ''
  });

  const [attachments, setAttachments] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchClients();
    fetchInvoices();
  }, []);

  useEffect(() => {
    // Filter invoices by selected client
    if (formData.clientId) {
      const filtered = invoices.filter(inv => inv.clientId === formData.clientId);
      setFilteredInvoices(filtered);
    } else {
      setFilteredInvoices([]);
    }
  }, [formData.clientId, invoices]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients?limit=1000');
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      toast.error('Failed to load clients');
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices?status=SENT&limit=1000');
      setInvoices(response.data.invoices || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast.error('Failed to load invoices');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Clear invoice when client changes
    if (name === 'clientId') {
      setFormData(prev => ({ ...prev, invoiceId: '' }));
    }

    // Clear client and invoice when source changes to non-client/invoice
    if (name === 'source' && !['CLIENT', 'INVOICE'].includes(value)) {
      setFormData(prev => ({ ...prev, clientId: '', invoiceId: '' }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Max 5MB.`);
        return;
      }

      // Check file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error(`File ${file.name} type not allowed. Use JPG, PNG, or PDF.`);
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAttachments(prev => [...prev, base64]);
        toast.success(`File ${file.name} uploaded`);
      };
      reader.onerror = () => {
        toast.error(`Failed to upload ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.transactionDate) {
      newErrors.transactionDate = 'Transaction date is required';
    }
    if (!formData.source) {
      newErrors.source = 'Source of funds is required';
    }
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (attachments.length === 0) {
      newErrors.attachments = 'At least one receipt/evidence is required';
    }

    // Source-specific validation
    if (['CLIENT', 'INVOICE'].includes(formData.source) && !formData.clientId) {
      newErrors.clientId = 'Client is required for this source';
    }

    // Payment method-specific validation
    if (formData.paymentMethod === 'CASH' && !formData.receiptNumber) {
      newErrors.receiptNumber = 'Receipt number is required for cash payments';
    }
    if (['BANK_TRANSFER', 'POS'].includes(formData.paymentMethod) && !formData.referenceNumber) {
      newErrors.referenceNumber = 'Reference number is required for transfers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        attachments,
        clientId: formData.clientId || undefined,
        invoiceId: formData.invoiceId || undefined
      };

      await api.post('/money-in', payload);
      
      toast.success('Money In record created successfully!');
      navigate('/secretary/money-in');
    } catch (error: any) {
      console.error('Failed to create Money In:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create Money In record';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sourceOptions = [
    { value: 'CLIENT', label: 'Client Payment' },
    { value: 'INVOICE', label: 'Invoice Payment' },
    { value: 'STAFF', label: 'Staff Contribution' },
    { value: 'ASSET_SALE', label: 'Asset Sale' },
    { value: 'LOAN', label: 'Loan' },
    { value: 'CAPITAL_INJECTION', label: 'Capital Injection' },
    { value: 'MISCELLANEOUS', label: 'Miscellaneous' }
  ];

  const paymentMethods = [
    { value: 'CASH', label: 'Cash', icon: Banknote },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Building2 },
    { value: 'POS', label: 'POS', icon: CreditCard },
    { value: 'CHEQUE', label: 'Cheque', icon: FileText },
    { value: 'MOBILE_MONEY', label: 'Mobile Money', icon: CreditCard },
    { value: 'OTHER', label: 'Other', icon: Receipt }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Record Money In</h1>
        <p className="text-sm text-gray-600 mt-1">
          Record all incoming money with proper documentation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount & Date */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Amount & Date
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (NGN) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="transactionDate"
                value={formData.transactionDate}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  errors.transactionDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.transactionDate && (
                <p className="text-red-500 text-xs mt-1">{errors.transactionDate}</p>
              )}
            </div>
          </div>
        </div>

        {/* Source & Payment Method */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            Source & Payment Details
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source of Funds <span className="text-red-500">*</span>
            </label>
            <select
              name="source"
              value={formData.source}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.source ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {sourceOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.source && (
              <p className="text-red-500 text-xs mt-1">{errors.source}</p>
            )}
          </div>

          {/* Client Selection (if source is CLIENT or INVOICE) */}
          {['CLIENT', 'INVOICE'].includes(formData.source) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client <span className="text-red-500">*</span>
                </label>
                <select
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                    errors.clientId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Client</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>
                      {client.companyName || client.clientName}
                    </option>
                  ))}
                </select>
                {errors.clientId && (
                  <p className="text-red-500 text-xs mt-1">{errors.clientId}</p>
                )}
              </div>

              {formData.source === 'INVOICE' && formData.clientId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice (Optional)
                  </label>
                  <select
                    name="invoiceId"
                    value={formData.invoiceId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Invoice</option>
                    {filteredInvoices.map(invoice => (
                      <option key={invoice._id} value={invoice._id}>
                        {invoice.invoiceNumber} - NGN {invoice.amount.toLocaleString()} 
                        {invoice.paidAmount ? ` (Paid: ${invoice.paidAmount})` : ''}
                      </option>
                    ))}
                  </select>
                  {formData.invoiceId && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Invoice payment will be automatically updated
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {paymentMethods.map(method => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.value as any }))}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      formData.paymentMethod === method.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{method.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.paymentMethod && (
              <p className="text-red-500 text-xs mt-1">{errors.paymentMethod}</p>
            )}
          </div>

          {/* Payment Method Specific Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.paymentMethod === 'CASH' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="receiptNumber"
                  value={formData.receiptNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                    errors.receiptNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="REC-001"
                />
                {errors.receiptNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.receiptNumber}</p>
                )}
              </div>
            )}

            {['BANK_TRANSFER', 'POS'].includes(formData.paymentMethod) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                      errors.referenceNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="TRF123456789"
                  />
                  {errors.referenceNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.referenceNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="First Bank"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description & Notes */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Description & Notes
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Brief description of the transaction..."
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="Any additional information..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category (Optional)
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Security Services, Consultation"
            />
          </div>
        </div>

        {/* Evidence Upload */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-600" />
            Evidence (Receipt/Bank Alert) <span className="text-red-500">*</span>
          </h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id="fileUpload"
              multiple
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="fileUpload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">
                Click to upload receipts or bank alerts
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG, PDF (max 5MB each)
              </p>
            </label>
          </div>

          {errors.attachments && (
            <p className="text-red-500 text-xs">{errors.attachments}</p>
          )}

          {/* Uploaded Files */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Uploaded Files ({attachments.length})
              </p>
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-700">
                    Evidence {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/secretary/money-in')}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Record Money In
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
