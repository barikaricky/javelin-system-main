import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { DollarSign, Users, AlertCircle, TrendingUp, Filter, Download } from 'lucide-react';

interface Salary {
  _id: string;
  workerName: string;
  workerRole: string;
  month: number;
  year: number;
  baseSalary: number;
  monthlySalary: number;
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  createdAt: string;
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  allowances: Array<{ name: string; amount: number; description?: string }>;
  deductions: Array<{
    type: string;
    amount: number;
    reason: string;
    isSystemGenerated: boolean;
  }>;
  worker?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface Stats {
  totalWorkers: number;
  totalBaseSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  totalNetSalary: number;
  paidCount: number;
  pendingCount: number;
  approvedCount: number;
}

const SalaryPanel: React.FC = () => {
  console.log('🔵 SalaryPanel component rendering');
  
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    console.log('SalaryPanel mounted - fetching data');
    fetchSalaries();
    fetchStats();
  }, [selectedMonth, selectedYear, selectedRole, selectedStatus]);

  const fetchSalaries = async () => {
    try {
      console.log('Fetching salaries...');
      setLoading(true);
      const params: any = {
        month: selectedMonth,
        year: selectedYear
      };
      if (selectedRole) params.workerRole = selectedRole;
      if (selectedStatus) params.status = selectedStatus;

      const response = await api.get('/salary', { params });
      console.log('Salaries fetched:', response.data.data);
      setSalaries(response.data.data);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch salaries:', err);
      setError(err.response?.data?.message || 'Failed to fetch salaries');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('Fetching salary stats...');
      const params: any = {
        month: selectedMonth,
        year: selectedYear
      };
      if (selectedRole) params.workerRole = selectedRole;
      
      const response = await api.get('/salary/stats', { params });
      console.log('Stats fetched:', response.data.data);
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: any = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRoleBadge = (role: string) => {
    const roleColors: any = {
      OPERATOR: 'bg-purple-100 text-purple-800',
      SUPERVISOR: 'bg-indigo-100 text-indigo-800',
      GENERAL_SUPERVISOR: 'bg-blue-100 text-blue-800',
      MANAGER: 'bg-green-100 text-green-800',
      SECRETARY: 'bg-pink-100 text-pink-800'
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Salary Panel</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">View-only access to worker salaries</p>
        </div>
        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm font-medium">Read-Only Mode</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Workers</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{stats.totalWorkers}</p>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">(Excluding Directors)</p>
              </div>
              <div className="bg-blue-100 rounded-full p-2 sm:p-3">
                <Users className="text-blue-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Monthly Salary</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.totalBaseSalary)}
                </p>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">Before deductions</p>
              </div>
              <div className="bg-green-100 rounded-full p-2 sm:p-3">
                <DollarSign className="text-green-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Deductions</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600 mt-1">
                  {formatCurrency(stats.totalDeductions)}
                </p>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">This month</p>
              </div>
              <div className="bg-red-100 rounded-full p-2 sm:p-3">
                <TrendingUp className="text-red-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Net Payment</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(stats.totalNetSalary)}
                </p>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">To be paid out</p>
              </div>
              <div className="bg-green-100 rounded-full p-2 sm:p-3">
                <DollarSign className="text-green-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Total Payment Summary */}
      {stats && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium opacity-90">Total Payment for {months[selectedMonth - 1]} {selectedYear}</p>
              <p className="text-2xl sm:text-4xl font-bold mt-2">
                {formatCurrency(stats.totalNetSalary)}
              </p>
              <p className="text-xs sm:text-sm mt-2 opacity-80">
                {stats.totalWorkers} workers • Excluding Director salaries
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-3 sm:p-4">
              <DollarSign className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Filter className="text-gray-600 w-4 h-4 sm:w-5 sm:h-5" />
          <h3 className="text-sm sm:text-base font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="OPERATOR">Operator</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="GENERAL_SUPERVISOR">General Supervisor</option>
              <option value="MANAGER">Manager</option>
              <option value="SECRETARY">Secretary</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Salaries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bank Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Loading salaries...
                  </td>
                </tr>
              ) : salaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No workers found for {months[selectedMonth - 1]} {selectedYear}
                  </td>
                </tr>
              ) : (
                salaries.map((salary) => (
                  <tr key={salary._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {salary.worker?.name || salary.workerName}
                      </div>
                      <div className="text-sm text-blue-600">
                        {salary.worker?.email || 'No email'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {months[salary.month - 1]} {salary.year}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {salary.accountName || 'Not provided'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {salary.accountNumber || 'No account'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {salary.bankName || 'No bank'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(salary.workerRole)}`}>
                        {salary.workerRole.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(salary.monthlySalary || salary.baseSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -{formatCurrency(salary.totalDeductions)}
                      {salary.deductions && salary.deductions.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {salary.deductions.length} deduction(s)
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {formatCurrency(salary.netSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(salary.status)}`}>
                        {salary.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Table Footer with Totals */}
            {!loading && salaries.length > 0 && (
              <tfoot className="bg-gray-100 font-semibold">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900" colSpan={3}>
                    TOTAL ({salaries.length} workers)
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatCurrency(salaries.reduce((sum, s) => sum + (s.monthlySalary || s.baseSalary), 0))}
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600">
                    -{formatCurrency(salaries.reduce((sum, s) => sum + s.totalDeductions, 0))}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600">
                    {formatCurrency(salaries.reduce((sum, s) => sum + s.netSalary, 0))}
                  </td>
                  <td className="px-6 py-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 p-3">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              Loading salaries...
            </div>
          ) : salaries.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No workers found for {months[selectedMonth - 1]} {selectedYear}
            </div>
          ) : (
            salaries.map((salary) => (
              <div key={salary._id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      {salary.worker?.name || salary.workerName}
                    </p>
                    <p className="text-xs text-blue-600">
                      {salary.worker?.email || 'No email'}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(salary.status)}`}>
                    {salary.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getRoleBadge(salary.workerRole)}`}>
                    {salary.workerRole.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {months[salary.month - 1]} {salary.year}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Monthly Salary</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(salary.monthlySalary || salary.baseSalary)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Deductions</p>
                    <p className="text-sm text-red-600">
                      -{formatCurrency(salary.totalDeductions)}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Net Payment</span>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(salary.netSalary)}
                    </span>
                  </div>
                </div>

                {salary.accountName && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Bank Details</p>
                    <p className="text-xs font-medium text-gray-900">{salary.accountName}</p>
                    <p className="text-xs text-gray-600">{salary.bankName} • {salary.accountNumber}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confidentiality Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <AlertCircle className="text-amber-600 mt-0.5 w-4 h-4 sm:w-5 sm:h-5" />
          <div className="text-xs sm:text-sm text-amber-800">
            <p className="font-semibold mb-1">Confidentiality Notice</p>
            <p>This information is strictly confidential. All views are logged for security purposes. Do not share, screenshot, or export this data.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryPanel;
