import React, { useState, useEffect } from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  PieChart,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { api } from '../../lib/api';

interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

interface ClientBreakdown {
  clientId: string;
  clientName: string;
  total: number;
  count: number;
  percentage: number;
}

interface MonthComparison {
  currentMonth: number;
  previousMonth: number;
  difference: number;
  percentageChange: number;
  trend: 'increase' | 'decrease' | 'stable';
}

interface MonthlyLogData {
  month: number;
  year: number;
  monthName: string;
  totalMoneyIn: number;
  totalMoneyOut: number;
  totalSalary: number;
  netMonthlyPosition: number;
  categoryBreakdown: CategoryBreakdown[];
  clientBreakdown: ClientBreakdown[];
  comparison: {
    moneyIn: MonthComparison;
    moneyOut: MonthComparison;
    salary: MonthComparison;
  };
}

const MonthlyLogs: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyLog, setMonthlyLog] = useState<MonthlyLogData | null>(null);
  const [loading, setLoading] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchMonthlyLog();
  }, [selectedMonth, selectedYear]);

  const fetchMonthlyLog = async () => {
    try {
      setLoading(true);
      const response = await api.get('/financial/monthly-logs', {
        params: { month: selectedMonth, year: selectedYear }
      });
      setMonthlyLog(response.data.data);
    } catch (error) {
      console.error('Failed to fetch monthly log:', error);
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

  const getTrendIcon = (trend: string) => {
    if (trend === 'increase') return <ArrowUp className="text-green-600" size={16} />;
    if (trend === 'decrease') return <ArrowDown className="text-red-600" size={16} />;
    return <Minus className="text-gray-600" size={16} />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'increase') return 'text-green-600';
    if (trend === 'decrease') return 'text-red-600';
    return 'text-gray-600';
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
          <h1 className="text-2xl font-bold text-gray-900">Monthly Financial Logs</h1>
          <p className="text-sm text-gray-600 mt-1">Monthly financial aggregation and trends</p>
        </div>
        
        {/* Month/Year Selector */}
        <div className="flex items-center gap-3">
          <Calendar className="text-gray-600" size={20} />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Monthly Money In */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Money In</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(monthlyLog?.totalMoneyIn || 0)}
              </p>
              {monthlyLog?.comparison.moneyIn && (
                <div className="flex items-center gap-1 mt-2">
                  {getTrendIcon(monthlyLog.comparison.moneyIn.trend)}
                  <span className={`text-xs font-medium ${getTrendColor(monthlyLog.comparison.moneyIn.trend)}`}>
                    {Math.abs(monthlyLog.comparison.moneyIn.percentageChange).toFixed(1)}% vs last month
                  </span>
                </div>
              )}
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        {/* Monthly Money Out */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Money Out</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {formatCurrency(monthlyLog?.totalMoneyOut || 0)}
              </p>
              {monthlyLog?.comparison.moneyOut && (
                <div className="flex items-center gap-1 mt-2">
                  {getTrendIcon(monthlyLog.comparison.moneyOut.trend)}
                  <span className={`text-xs font-medium ${getTrendColor(monthlyLog.comparison.moneyOut.trend)}`}>
                    {Math.abs(monthlyLog.comparison.moneyOut.percentageChange).toFixed(1)}% vs last month
                  </span>
                </div>
              )}
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        {/* Monthly Salary */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Salary Total</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {formatCurrency(monthlyLog?.totalSalary || 0)}
              </p>
              {monthlyLog?.comparison.salary && (
                <div className="flex items-center gap-1 mt-2">
                  {getTrendIcon(monthlyLog.comparison.salary.trend)}
                  <span className={`text-xs font-medium ${getTrendColor(monthlyLog.comparison.salary.trend)}`}>
                    {Math.abs(monthlyLog.comparison.salary.percentageChange).toFixed(1)}% vs last month
                  </span>
                </div>
              )}
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        {/* Net Monthly Position */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Position</p>
              <p className={`text-2xl font-bold mt-2 ${
                (monthlyLog?.netMonthlyPosition || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(monthlyLog?.netMonthlyPosition || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">After all expenses</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <DollarSign className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown (Money Out) */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <PieChart className="text-blue-600" size={24} />
          <h2 className="text-lg font-semibold text-gray-900">Money Out by Category</h2>
        </div>
        <div className="space-y-3">
          {monthlyLog?.categoryBreakdown.map((category) => (
            <div key={category.category} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{category.category}</span>
                  <span className="text-sm text-gray-600">{category.count} transaction(s)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="ml-4 text-right">
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(category.total)}</p>
                <p className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
          {(!monthlyLog?.categoryBreakdown || monthlyLog.categoryBreakdown.length === 0) && (
            <p className="text-center text-sm text-gray-500 py-4">No expenses recorded for this month</p>
          )}
        </div>
      </div>

      {/* Client Breakdown (Money In) */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="text-green-600" size={24} />
          <h2 className="text-lg font-semibold text-gray-900">Money In by Client</h2>
        </div>
        <div className="space-y-3">
          {monthlyLog?.clientBreakdown.map((client) => (
            <div key={client.clientId} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{client.clientName}</span>
                  <span className="text-sm text-gray-600">{client.count} transaction(s)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${client.percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="ml-4 text-right">
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(client.total)}</p>
                <p className="text-xs text-gray-500">{client.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
          {(!monthlyLog?.clientBreakdown || monthlyLog.clientBreakdown.length === 0) && (
            <p className="text-center text-sm text-gray-500 py-4">No client income recorded for this month</p>
          )}
        </div>
      </div>

      {/* Month Comparison Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Month vs Previous Month</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {monthlyLog?.comparison.moneyIn && (
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600 mb-2">Money In Comparison</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Current</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(monthlyLog.comparison.moneyIn.currentMonth)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Previous</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(monthlyLog.comparison.moneyIn.previousMonth)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {getTrendIcon(monthlyLog.comparison.moneyIn.trend)}
                <span className={`text-sm font-medium ${getTrendColor(monthlyLog.comparison.moneyIn.trend)}`}>
                  {formatCurrency(Math.abs(monthlyLog.comparison.moneyIn.difference))} 
                  ({Math.abs(monthlyLog.comparison.moneyIn.percentageChange).toFixed(1)}%)
                </span>
              </div>
            </div>
          )}

          {monthlyLog?.comparison.moneyOut && (
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600 mb-2">Money Out Comparison</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Current</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(monthlyLog.comparison.moneyOut.currentMonth)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Previous</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(monthlyLog.comparison.moneyOut.previousMonth)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {getTrendIcon(monthlyLog.comparison.moneyOut.trend)}
                <span className={`text-sm font-medium ${getTrendColor(monthlyLog.comparison.moneyOut.trend)}`}>
                  {formatCurrency(Math.abs(monthlyLog.comparison.moneyOut.difference))} 
                  ({Math.abs(monthlyLog.comparison.moneyOut.percentageChange).toFixed(1)}%)
                </span>
              </div>
            </div>
          )}

          {monthlyLog?.comparison.salary && (
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600 mb-2">Salary Comparison</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Current</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(monthlyLog.comparison.salary.currentMonth)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Previous</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(monthlyLog.comparison.salary.previousMonth)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {getTrendIcon(monthlyLog.comparison.salary.trend)}
                <span className={`text-sm font-medium ${getTrendColor(monthlyLog.comparison.salary.trend)}`}>
                  {formatCurrency(Math.abs(monthlyLog.comparison.salary.difference))} 
                  ({Math.abs(monthlyLog.comparison.salary.percentageChange).toFixed(1)}%)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyLogs;
