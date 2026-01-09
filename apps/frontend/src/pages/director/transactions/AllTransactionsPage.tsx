import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Download, 
  Search, RefreshCw, ArrowUpDown, Lightbulb, PieChart, BarChart3,
  AlertCircle, CheckCircle, Clock, MapPin, User, CreditCard, FileText,
  Calculator, BookOpen, Receipt, Printer
} from 'lucide-react';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface Transaction {
  _id: string;
  type: 'MONEY_IN' | 'MONEY_OUT' | 'BIT_EXPENSE' | 'SALARY';
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
  referenceNumber: string;
  beneficiary: string;
  recordedBy: string;
  status: string;
  location: string;
  createdAt: string;
}

interface Summary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  netWorth: number;
  byType: {
    moneyIn: number;
    moneyOut: number;
    bitExpenses: number;
    salaries: number;
  };
  count: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AllTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(true);
  const [showLedger, setShowLedger] = useState(false);
  const [showProfitLoss, setShowProfitLoss] = useState(false);
  const [showBalanceSheet, setShowBalanceSheet] = useState(false);
  
  // Filters
  const [period, setPeriod] = useState('month'); // week, month, year, all
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, [period, typeFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/all-transactions', {
        params: { period, type: typeFilter, limit: 100 }
      });
      
      setTransactions(response.data.data.transactions);
      setSummary(response.data.data.summary);
      setSuggestions(response.data.data.suggestions || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedTransactions = transactions
    .filter(t => {
      const matchesSearch = searchQuery === '' || 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.beneficiary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = Math.abs(a.amount) - Math.abs(b.amount);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'beneficiary':
          comparison = a.beneficiary.localeCompare(b.beneficiary);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const formatCurrency = (amount: number) => {
    return `₦${Math.abs(amount).toLocaleString()}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MONEY_IN': return 'text-green-600 bg-green-50';
      case 'MONEY_OUT': return 'text-red-600 bg-red-50';
      case 'BIT_EXPENSE': return 'text-orange-600 bg-orange-50';
      case 'SALARY': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MONEY_IN': return <TrendingUp className="w-4 h-4" />;
      case 'MONEY_OUT': return <TrendingDown className="w-4 h-4" />;
      case 'BIT_EXPENSE': return <MapPin className="w-4 h-4" />;
      case 'SALARY': return <User className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  // Prepare chart data
  const typeChartData = summary ? [
    { name: 'Money In', value: summary.byType.moneyIn, color: '#10b981' },
    { name: 'Money Out', value: summary.byType.moneyOut, color: '#ef4444' },
    { name: 'BEAT Expenses', value: summary.byType.bitExpenses, color: '#f59e0b' },
    { name: 'Salaries', value: summary.byType.salaries, color: '#3b82f6' }
  ].filter(item => item.value > 0) : [];

  const categoryData = transactions.reduce((acc: any[], t) => {
    const existing = acc.find(item => item.category === t.category);
    if (existing) {
      existing.value += Math.abs(t.amount);
    } else {
      acc.push({ category: t.category, value: Math.abs(t.amount) });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value).slice(0, 6);

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Beneficiary', 'Payment Method', 'Status'];
    const rows = filteredAndSortedTransactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.type,
      t.category,
      t.description,
      t.amount,
      t.beneficiary,
      t.paymentMethod,
      t.status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export successful!');
  };

  const exportProfitLoss = () => {
    if (!summary) return;
    
    const plStatement = [
      '=== PROFIT & LOSS STATEMENT ===',
      `Period: ${period.toUpperCase()}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'REVENUE',
      `  Money In: ${formatCurrency(summary.byType.moneyIn)}`,
      `  Total Revenue: ${formatCurrency(summary.totalIncome)}`,
      '',
      'EXPENSES',
      `  Money Out: ${formatCurrency(summary.byType.moneyOut)}`,
      `  BEAT Expenses: ${formatCurrency(summary.byType.bitExpenses)}`,
      `  Salaries: ${formatCurrency(summary.byType.salaries)}`,
      `  Total Expenses: ${formatCurrency(summary.totalExpenses)}`,
      '',
      `NET PROFIT/LOSS: ${formatCurrency(summary.netCashFlow)}`,
      `Profit Margin: ${((summary.netCashFlow / summary.totalIncome) * 100).toFixed(2)}%`,
    ].join('\n');
    
    const blob = new Blob([plStatement], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-loss-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    toast.success('Profit & Loss exported!');
  };

  const exportLedger = () => {
    const ledgerContent = [
      '=== GENERAL LEDGER ===',
      `Period: ${period.toUpperCase()}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'DATE | TYPE | CATEGORY | DESCRIPTION | DEBIT | CREDIT | BALANCE',
      '-'.repeat(100),
    ];
    
    let runningBalance = 0;
    filteredAndSortedTransactions.forEach(t => {
      const debit = t.amount > 0 ? Math.abs(t.amount) : 0;
      const credit = t.amount < 0 ? Math.abs(t.amount) : 0;
      runningBalance += t.amount;
      
      ledgerContent.push(
        `${new Date(t.date).toLocaleDateString()} | ${t.type} | ${t.category} | ${t.description.substring(0, 30)} | ${debit > 0 ? formatCurrency(debit) : '-'} | ${credit > 0 ? formatCurrency(credit) : '-'} | ${formatCurrency(runningBalance)}`
      );
    });
    
    ledgerContent.push('', `CLOSING BALANCE: ${formatCurrency(runningBalance)}`);
    
    const blob = new Blob([ledgerContent.join('\n')], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    toast.success('Ledger exported!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">All Transactions</h1>
            <p className="text-blue-100 mt-1">Complete financial overview with AI insights & accounting reports</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={loadData}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowLedger(!showLedger)}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <BookOpen className="w-4 h-4" />
              Ledger
            </button>
            <button
              onClick={() => setShowProfitLoss(!showProfitLoss)}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <Calculator className="w-4 h-4" />
              P&L
            </button>
            <button
              onClick={exportLedger}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 font-medium text-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8" />
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Income</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(summary.totalIncome)}</p>
            <p className="text-green-100 text-sm mt-1">Total Money In</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-5 text-white shadow-lg animate-fade-in" style={{animationDelay: '100ms'}}>
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8" />
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Expenses</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(summary.totalExpenses)}</p>
            <p className="text-red-100 text-sm mt-1">Total Outflow</p>
          </div>

          <div className={`bg-gradient-to-br ${summary.netCashFlow >= 0 ? 'from-blue-500 to-cyan-600' : 'from-orange-500 to-red-600'} rounded-xl p-5 text-white shadow-lg animate-fade-in`} style={{animationDelay: '200ms'}}>
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8" />
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Net</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(summary.netCashFlow)}</p>
            <p className="text-blue-100 text-sm mt-1">Cash Flow</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg animate-fade-in" style={{animationDelay: '300ms'}}>
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8" />
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Total</span>
            </div>
            <p className="text-3xl font-bold">{summary.count}</p>
            <p className="text-purple-100 text-sm mt-1">Transactions</p>
          </div>
        </div>
      )}

      {/* Profit & Loss Statement */}
      {showProfitLoss && summary && (
        <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-blue-600" />
              Profit & Loss Statement
            </h3>
            <button
              onClick={exportProfitLoss}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export P&L
            </button>
          </div>

          <div className="space-y-6">
            {/* Revenue Section */}
            <div>
              <div className="flex items-center justify-between py-2 border-b-2 border-gray-300 mb-3">
                <h4 className="font-bold text-lg text-gray-900">REVENUE</h4>
              </div>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between text-gray-700">
                  <span>Money In</span>
                  <span className="font-medium">{formatCurrency(summary.byType.moneyIn)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t">
                  <span>Total Revenue</span>
                  <span className="text-green-600">{formatCurrency(summary.totalIncome)}</span>
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <div className="flex items-center justify-between py-2 border-b-2 border-gray-300 mb-3">
                <h4 className="font-bold text-lg text-gray-900">OPERATING EXPENSES</h4>
              </div>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between text-gray-700">
                  <span>Money Out</span>
                  <span className="font-medium">{formatCurrency(summary.byType.moneyOut)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>BEAT Expenses</span>
                  <span className="font-medium">{formatCurrency(summary.byType.bitExpenses)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Salaries & Wages</span>
                  <span className="font-medium">{formatCurrency(summary.byType.salaries)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t">
                  <span>Total Expenses</span>
                  <span className="text-red-600">{formatCurrency(summary.totalExpenses)}</span>
                </div>
              </div>
            </div>

            {/* Net Profit/Loss */}
            <div className="pt-4 border-t-4 border-gray-400">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">NET PROFIT/LOSS</span>
                <span className={`text-2xl font-bold ${summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.netCashFlow >= 0 ? '+' : ''}{formatCurrency(summary.netCashFlow)}
                </span>
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>Profit Margin:</span>
                <span className="font-semibold">
                  {((summary.netCashFlow / summary.totalIncome) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General Ledger */}
      {showLedger && (
        <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              General Ledger
            </h3>
            <button
              onClick={exportLedger}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Ledger
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Date</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Type</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Description</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">Debit</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">Credit</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(() => {
                  let runningBalance = 0;
                  return filteredAndSortedTransactions.slice(0, 50).map((t, index) => {
                    const debit = t.amount > 0 ? Math.abs(t.amount) : 0;
                    const credit = t.amount < 0 ? Math.abs(t.amount) : 0;
                    runningBalance += t.amount;
                    
                    return (
                      <tr key={t._id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-900">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(t.type)}`}>
                            {t.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-700">{t.description.substring(0, 40)}</td>
                        <td className="px-3 py-2 text-right text-green-600 font-medium">
                          {debit > 0 ? formatCurrency(debit) : '-'}
                        </td>
                        <td className="px-3 py-2 text-right text-red-600 font-medium">
                          {credit > 0 ? formatCurrency(credit) : '-'}
                        </td>
                        <td className={`px-3 py-2 text-right font-semibold ${runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(runningBalance)}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-right font-bold text-gray-900">
                    CLOSING BALANCE:
                  </td>
                  <td className={`px-3 py-3 text-right font-bold text-lg ${
                    summary && summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {summary && formatCurrency(summary.netCashFlow)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {filteredAndSortedTransactions.length > 50 && (
            <p className="text-center text-sm text-gray-600 mt-4">
              Showing first 50 transactions. Export ledger to view all.
            </p>
          )}
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="bg-amber-500 p-3 rounded-xl shadow-md">
              <Lightbulb className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-xl text-gray-900 mb-2 flex items-center gap-2">
                Professional Financial Intelligence
                <span className="text-xs bg-amber-500 text-white px-2 py-1 rounded-full">AI Powered</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">Smart analysis from your financial data - acting as your virtual accountant</p>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => {
                  const isUrgent = suggestion.includes('🚨') || suggestion.includes('🔴');
                  const isWarning = suggestion.includes('⚠️') || suggestion.includes('🟡');
                  const isGood = suggestion.includes('✅') || suggestion.includes('🟢') || suggestion.includes('⭐') || suggestion.includes('🏆');
                  
                  return (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg border-l-4 ${
                        isUrgent ? 'bg-red-50 border-red-500' :
                        isWarning ? 'bg-yellow-50 border-yellow-500' :
                        isGood ? 'bg-green-50 border-green-500' :
                        'bg-blue-50 border-blue-500'
                      } animate-fade-in shadow-sm hover:shadow-md transition-shadow`}
                      style={{animationDelay: `${index * 100}ms`}}
                    >
                      <p className="text-sm leading-relaxed text-gray-800 font-medium">
                        {suggestion}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 bg-white/60 rounded-lg border border-amber-200">
                <p className="text-xs text-gray-600 flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  <span>
                    <strong>Note:</strong> These insights are generated using advanced financial analysis rules based on accounting best practices. 
                    Review with your management team and adjust strategies based on your specific business context.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {showCharts && typeChartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Financial Analytics</h3>
            <button
              onClick={() => setShowCharts(!showCharts)}
              className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Hide Charts
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Transaction Type Distribution */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">By Transaction Type</h4>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPie>
                  <Pie
                    data={typeChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                  >
                    {typeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            </div>

            {/* Top Categories */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">Top 6 Categories</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Period Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Time Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Transaction Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="money_in">Money In</option>
              <option value="money_out">Money Out</option>
              <option value="bit_expense">BEAT Expenses</option>
              <option value="salary">Salaries</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ArrowUpDown className="w-4 h-4 inline mr-1" />
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="type">Type</option>
              <option value="beneficiary">Beneficiary</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beneficiary</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedTransactions.map((transaction, index) => (
                <tr 
                  key={transaction._id} 
                  className="hover:bg-gray-50 transition-colors animate-fade-in"
                  style={{animationDelay: `${index * 20}ms`}}
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                      {getTypeIcon(transaction.type)}
                      {transaction.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {transaction.description.substring(0, 40)}
                    {transaction.description.length > 40 && '...'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{transaction.beneficiary}</td>
                  <td className={`px-4 py-3 text-sm text-right font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount >= 0 ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      transaction.status === 'PAID' || transaction.status === 'RECEIVED' || transaction.status === 'APPROVED'
                        ? 'bg-green-100 text-green-700'
                        : transaction.status === 'PENDING_APPROVAL'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{transaction.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedTransactions.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllTransactionsPage;
