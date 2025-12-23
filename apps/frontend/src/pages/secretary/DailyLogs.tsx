import React, { useState, useEffect } from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Banknote,
  CreditCard,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../../lib/api';

interface Transaction {
  _id: string;
  transactionType: 'MONEY_IN' | 'MONEY_OUT';
  amount: number;
  description: string;
  paymentMethod: string;
  category?: string;
  recordedById: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  transactionDate: string;
  createdAt: string;
}

interface DailyLogData {
  date: string;
  totalMoneyIn: number;
  totalMoneyOut: number;
  dailySalaryImpact: number;
  dailyNetBalance: number;
  moneyInEntries: Transaction[];
  moneyOutEntries: Transaction[];
  paymentMethods: {
    method: string;
    count: number;
    total: number;
  }[];
}

const DailyLogs: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyLog, setDailyLog] = useState<DailyLogData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMoneyIn, setShowMoneyIn] = useState(false);
  const [showMoneyOut, setShowMoneyOut] = useState(false);

  useEffect(() => {
    fetchDailyLog();
  }, [selectedDate]);

  const fetchDailyLog = async () => {
    try {
      setLoading(true);
      const response = await api.get('/financial/daily-logs', {
        params: { date: selectedDate }
      });
      setDailyLog(response.data.data);
    } catch (error) {
      console.error('Failed to fetch daily log:', error);
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h1 className="text-2xl font-bold text-gray-900">Daily Financial Logs</h1>
          <p className="text-sm text-gray-600 mt-1">Track day-by-day financial activity</p>
        </div>
        
        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <Calendar className="text-gray-600" size={20} />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Daily Money In */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Money In</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(dailyLog?.totalMoneyIn || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {dailyLog?.moneyInEntries.length || 0} transaction(s)
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        {/* Daily Money Out */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Money Out</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {formatCurrency(dailyLog?.totalMoneyOut || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {dailyLog?.moneyOutEntries.length || 0} transaction(s)
              </p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        {/* Daily Salary Impact */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Salary Impact</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {formatCurrency(dailyLog?.dailySalaryImpact || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">If applicable</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        {/* Daily Net Balance */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Balance</p>
              <p className={`text-2xl font-bold mt-2 ${
                (dailyLog?.dailyNetBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(dailyLog?.dailyNetBalance || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Daily position</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <DollarSign className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods Used */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods Used</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dailyLog?.paymentMethods.map((method) => (
            <div key={method.method} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-lg p-2">
                  {method.method === 'CASH' ? (
                    <Banknote className="text-blue-600" size={20} />
                  ) : (
                    <CreditCard className="text-blue-600" size={20} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{method.method}</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(method.total)}</p>
                  <p className="text-xs text-gray-500">{method.count} transaction(s)</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Money In Entries - Drill Down */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => setShowMoneyIn(!showMoneyIn)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="text-green-600" size={24} />
            <div className="text-left">
              <h2 className="text-lg font-semibold text-gray-900">Money In Entries</h2>
              <p className="text-sm text-gray-600">{dailyLog?.moneyInEntries.length || 0} entries for this day</p>
            </div>
          </div>
          {showMoneyIn ? <ChevronUp /> : <ChevronDown />}
        </button>

        {showMoneyIn && (
          <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyLog?.moneyInEntries.map((entry) => (
                    <tr key={entry._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(entry.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{entry.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {entry.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrency(entry.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.recordedById.firstName} {entry.recordedById.lastName}
                      </td>
                    </tr>
                  ))}
                  {(!dailyLog?.moneyInEntries || dailyLog.moneyInEntries.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No Money In entries for this day
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Money Out Entries - Drill Down */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => setShowMoneyOut(!showMoneyOut)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <TrendingDown className="text-red-600" size={24} />
            <div className="text-left">
              <h2 className="text-lg font-semibold text-gray-900">Money Out Entries</h2>
              <p className="text-sm text-gray-600">{dailyLog?.moneyOutEntries.length || 0} entries for this day</p>
            </div>
          </div>
          {showMoneyOut ? <ChevronUp /> : <ChevronDown />}
        </button>

        {showMoneyOut && (
          <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyLog?.moneyOutEntries.map((entry) => (
                    <tr key={entry._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(entry.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{entry.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.category || 'Uncategorized'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                          {entry.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                        {formatCurrency(entry.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.recordedById.firstName} {entry.recordedById.lastName}
                      </td>
                    </tr>
                  ))}
                  {(!dailyLog?.moneyOutEntries || dailyLog.moneyOutEntries.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No Money Out entries for this day
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Read-only Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Eye className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-yellow-900">Read-Only Logs</h3>
            <p className="text-sm text-yellow-800 mt-1">
              These logs are read-only. Deleted records are excluded from totals. Managing Directors can view deleted records in the audit view.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyLogs;
