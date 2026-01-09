import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Search,
  Filter,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

interface BitExpense {
  id: string;
  bitId?: string;
  bitName: string;
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

export default function BeatExpensesPage() {
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
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBitDetails, setSelectedBitDetails] = useState<BitSummary | null>(null);
  const [beats, setBits] = useState<any[]>([]);

  useEffect(() => {
    loadBits();
    if (view === 'summary') {
      loadBitSummaries();
    } else {
      loadExpenses();
    }
  }, [view, period, selectedBit, categoryFilter, paymentFilter, dateRange]);

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
      const response = await api.get('/beat-expenses/summary', { params: { period } });
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
      if (selectedBit) params.bitId = selectedBit;
      if (categoryFilter) params.category = categoryFilter;
      if (paymentFilter) params.paymentMethod = paymentFilter;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const response = await api.get('/beat-expenses', { params });
      setExpenses(response.data.expenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
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
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                  Manager: Read-Only Access
                </span>
              </div>
            </div>
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
                          <p className="font-medium text-gray-900">{expense.bitName}</p>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {expenses.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No expenses found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
