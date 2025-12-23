import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Wallet,
  CreditCard,
  Banknote,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

interface FinancialSummary {
  totalMoneyIn: number;
  totalMoneyOut: number;
  totalSalaryObligation: number;
  netCashPosition: number;
  cashBreakdown: {
    cash: number;
    transfer: number;
  };
  outstandingInvoices: {
    count: number;
    amount: number;
  };
}

const FinancialOverview: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchFinancialSummary();
  }, [selectedMonth, selectedYear]);

  const fetchFinancialSummary = async () => {
    try {
      setLoading(true);
      const response = await api.get('/financial/overview', {
        params: { month: selectedMonth, year: selectedYear }
      });
      setSummary(response.data.data);
    } catch (error) {
      console.error('Failed to fetch financial summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Determine base path based on user role
  const getBasePath = () => {
    const role = user?.role?.toLowerCase();
    return role === 'director' ? '/director' : 
           role === 'manager' ? '/manager' : '/secretary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
          <p className="text-sm text-gray-600 mt-1">Real-time snapshot of company finances</p>
        </div>
        
        {/* Period Selector */}
        <div className="flex gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {months.map((month, index) => (
              <option key={index} value={index + 1}>{month}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Money In */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Money In</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(summary?.totalMoneyIn || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Current Period</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        {/* Total Money Out (Non-Salary) */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Money Out</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {formatCurrency(summary?.totalMoneyOut || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Excludes Salary</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        {/* Total Salary Obligation */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Salary Obligation</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {formatCurrency(summary?.totalSalaryObligation || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Current Month</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        {/* Net Cash Position */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Cash Position</p>
              <p className={`text-2xl font-bold mt-2 ${
                (summary?.netCashPosition || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(summary?.netCashPosition || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">After All Expenses</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <Wallet className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        {/* Cash vs Transfer Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-600">Payment Methods</p>
            <div className="bg-indigo-100 rounded-full p-2">
              <CreditCard className="text-indigo-600" size={20} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Banknote size={16} className="text-green-600" />
                <span className="text-sm text-gray-600">Cash</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(summary?.cashBreakdown.cash || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-blue-600" />
                <span className="text-sm text-gray-600">Transfer</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(summary?.cashBreakdown.transfer || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Outstanding Invoices */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Outstanding Invoices</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">
                {formatCurrency(summary?.outstandingInvoices.amount || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {summary?.outstandingInvoices.count || 0} Invoice(s)
              </p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <FileText className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Data Rules Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-blue-900">Data Integrity Rules</h3>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• All values are calculated automatically from approved transactions</li>
              <li>• Salary is displayed as a separate figure from operational expenses</li>
              <li>• Money Out excludes salary payments</li>
              <li>• No manual adjustments allowed - all data is derived from source records</li>
              <li>• Pending and incomplete records are excluded from totals</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate(`${getBasePath()}/daily-logs`)}
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-lg p-2">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Daily Logs</p>
              <p className="text-xs text-gray-600">View day-by-day activity</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate(`${getBasePath()}/monthly-logs`)}
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-lg p-2">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Monthly Logs</p>
              <p className="text-xs text-gray-600">Monthly aggregation & trends</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate(`${getBasePath()}/reports`)}
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 rounded-lg p-2">
              <FileText className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Reports</p>
              <p className="text-xs text-gray-600">Generate & export reports</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default FinancialOverview;
