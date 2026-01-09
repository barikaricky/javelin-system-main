import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Download,
  Edit2,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

interface BitExpense {
  id: string;
  beatId?: string;
  beatName: string;
  clientName?: string;
  locationName?: string;
  category: string;
  description: string;
  amount: number;
  dateIncurred: string;
  paymentMethod: string;
  isUnallocated: boolean;
  addedByName: string;
  addedByRole: string;
  lastEditedByName?: string;
  lastEditedAt?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
}

interface BitSummary {
  id: string;
  name: string;
  clientName: string;
  locationName: string;
  totalAmount: number;
  expenseCount: number;
  averageExpense: number;
  lastExpenseDate: string | null;
}

const CATEGORIES = {
  EQUIPMENT: 'Equipment Purchase',
  UNIFORMS: 'Uniforms',
  TRANSPORTATION: 'Transportation',
  FUEL: 'Fuel',
  MAINTENANCE: 'Maintenance',
  REPAIRS: 'Repairs',
  LOGISTICS: 'Logistics',
  EMERGENCY: 'Emergency Expenses',
  UTILITIES: 'Utilities',
  CONSUMABLES: 'Consumables',
  OTHER: 'Other',
};

const PAYMENT_METHODS = {
  CASH: 'Cash',
  TRANSFER: 'Bank Transfer',
  CARD: 'Card Payment',
  OTHER: 'Other',
};

export default function BitExpensesPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'summary'>('summary');
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [bitSummaries, setBitSummaries] = useState<BitSummary[]>([]);
  const [expenses, setExpenses] = useState<BitExpense[]>([]);
  const [selectedBit, setSelectedBit] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<BitExpense | null>(null);
  const [selectedBitDetails, setSelectedBitDetails] = useState<BitSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [beats, setBits] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [filteredBits, setFilteredBits] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    locationId: '',
    beatId: '',
    category: 'EQUIPMENT',
    description: '',
    amount: '',
    dateIncurred: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    notes: '',
  });

  useEffect(() => {
    loadLocations();
    loadBits();
    if (view === 'summary') {
      loadBitSummaries();
    } else {
      loadExpenses();
    }
  }, [view, period, selectedBit, categoryFilter, paymentFilter, dateRange]);

  useEffect(() => {
    // Filter beats when location changes
    if (selectedLocationId) {
      setFilteredBits(beats.filter(bit => bit.locationId?._id === selectedLocationId));
    } else {
      setFilteredBits(beats);
    }
  }, [selectedLocationId, beats]);

  const loadLocations = async () => {
    try {
      const response = await api.get('/locations');
      setLocations(response.data.locations || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadBits = async () => {
    try {
      const response = await api.get('/beats');
      setBits(response.data.beats || []);
    } catch (error) {
      console.error('Error loading BEATs:', error);
    }
  };

  const loadBitSummaries = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/bit-expenses/summary', { params: { period } });
      setBitSummaries(response.data);
    } catch (error) {
      console.error('Error loading BEAT summaries:', error);
      toast.error('Failed to load BEAT expense summaries');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        search: searchQuery,
        sortBy: 'date',
        sortOrder: 'desc',
      };
      if (selectedBit) params.beatId = selectedBit;
      if (categoryFilter) params.category = categoryFilter;
      if (paymentFilter) params.paymentMethod = paymentFilter;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const response = await api.get('/bit-expenses', { params });
      setExpenses(response.data.expenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/bit-expenses', {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      toast.success('Expense added successfully');
      setShowAddModal(false);
      resetForm();
      loadExpenses();
      loadBitSummaries();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add expense');
    }
  };

  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    try {
      await api.put(`/bit-expenses/${selectedExpense.id}`, {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      toast.success('Expense updated successfully');
      setShowEditModal(false);
      setSelectedExpense(null);
      resetForm();
      loadExpenses();
      loadBitSummaries();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update expense');
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'BEAT', 'Client', 'Category', 'Description', 'Amount', 'Payment Method', 'Added By'];
    const rows = expenses.map(exp => [
      new Date(exp.dateIncurred).toLocaleDateString(),
      exp.beatName,
      exp.clientName || '',
      CATEGORIES[exp.category as keyof typeof CATEGORIES],
      exp.description,
      exp.amount.toFixed(2),
      PAYMENT_METHODS[exp.paymentMethod as keyof typeof PAYMENT_METHODS],
      exp.addedByName,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bit-expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Expenses exported successfully');
  };

  const resetForm = () => {
    setSelectedLocationId('');
    setFormData({
      locationId: '',
      beatId: '',
      category: 'EQUIPMENT',
      description: '',
      amount: '',
      dateIncurred: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
      notes: '',
    });
  };

  const openEditModal = (expense: BitExpense) => {
    setSelectedExpense(expense);
    setFormData({
      beatId: expense.beatId || '',
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      dateIncurred: expense.dateIncurred.split('T')[0],
      paymentMethod: expense.paymentMethod,
      notes: expense.notes || '',
    });
    setShowEditModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Spending per BEAT</h1>
              <p className="text-sm text-gray-600 mt-1">Track operational expenses (Expenses Only - No Salary)</p>
              <p className="text-xs text-amber-600 mt-1">Secretary: Can add & edit expenses (cannot delete)</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add Expense
            </button>
          </div>

          {/* View Toggle & Period */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-2">
              <button
                onClick={() => setView('summary')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  view === 'summary' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                BEAT Summary
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  view === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Expenses
              </button>
            </div>

            {view === 'summary' && (
              <div className="flex gap-2">
                {(['week', 'month', 'year'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      period === p ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            )}

            {view === 'list' && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Filter className="w-4 h-4" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ml-auto"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {/* Filters */}
          {showFilters && view === 'list' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search expenses..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BEAT</label>
                <select
                  value={selectedBit}
                  onChange={e => setSelectedBit(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All BEATs</option>
                  {beats.map(bit => (
                    <option key={bit.id} value={bit.id}>{bit.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {Object.entries(CATEGORIES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentFilter}
                  onChange={e => setPaymentFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Methods</option>
                  {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {view === 'summary' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bitSummaries.map(summary => (
              <div key={summary.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-600 mb-1">{summary.locationName}</p>
                    <h3 className="font-bold text-lg text-gray-900">{summary.name}</h3>
                    <p className="text-sm text-gray-600">{summary.clientName}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedBit(summary.id);
                      setView('list');
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Total Spending ({getPeriodLabel()})</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalAmount)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Expense Count</p>
                      <p className="text-lg font-semibold text-gray-900">{summary.expenseCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Average</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(summary.averageExpense)}</p>
                    </div>
                  </div>

                  {summary.lastExpenseDate && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-600">Last Expense</p>
                      <p className="text-sm text-gray-900">{new Date(summary.lastExpenseDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">BEAT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added By</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.map(expense => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(expense.dateIncurred).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                            {expense.locationName || 'No Location'}
                          </p>
                          <p className="font-medium text-gray-900">{expense.beatName}</p>
                          {expense.clientName && <p className="text-xs text-gray-500">{expense.clientName}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {CATEGORIES[expense.category as keyof typeof CATEGORIES]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{expense.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {PAYMENT_METHODS[expense.paymentMethod as keyof typeof PAYMENT_METHODS]}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{expense.addedByName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => openEditModal(expense)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {showAddModal ? 'Add Expense' : 'Edit Expense'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedExpense(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={showAddModal ? handleAddExpense : handleEditExpense} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                    <select
                      value={selectedLocationId}
                      onChange={e => {
                        setSelectedLocationId(e.target.value);
                        setFormData({ ...formData, locationId: e.target.value, beatId: '' });
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Location</option>
                      {locations.map(location => (
                        <option key={location._id} value={location._id}>
                          {location.locationName} - {location.city}, {location.state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">BEAT</label>
                    <select
                      value={formData.beatId}
                      onChange={e => setFormData({ ...formData, beatId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      disabled={!selectedLocationId}
                    >
                      <option value="">Unallocated</option>
                      {filteredBits.map(bit => (
                        <option key={bit._id} value={bit._id}>{bit.beatName} - {bit.clientId?.companyName || 'No Client'}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(CATEGORIES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter expense description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        required
                        min="0"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Incurred *</label>
                      <input
                        type="date"
                        value={formData.dateIncurred}
                        onChange={e => setFormData({ ...formData, dateIncurred: e.target.value })}
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Additional notes (optional)..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      {showAddModal ? 'Add Expense' : 'Update Expense'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                        setSelectedExpense(null);
                        resetForm();
                      }}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
