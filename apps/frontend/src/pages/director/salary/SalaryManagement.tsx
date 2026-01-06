import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { 
  DollarSign, Users, AlertCircle, TrendingUp, Filter, 
  Plus, Edit, Trash2, CheckCircle, Ban, Eye, Download, Check, X 
} from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import toast, { Toaster } from 'react-hot-toast';

interface Salary {
  _id: string;
  worker: { _id: string; name: string; email: string };
  workerName: string;
  workerRole: string;
  month: number;
  year: number;
  baseSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  createdAt: string;
  allowances: Array<{ name: string; amount: number; description?: string }>;
  deductions: Array<{
    type: string;
    amount: number;
    reason: string;
    isSystemGenerated: boolean;
  }>;
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

const SalaryManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);

  // Form states
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [deductionType, setDeductionType] = useState('');
  const [deductionAmount, setDeductionAmount] = useState('');
  const [deductionReason, setDeductionReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  // Filters
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Success notification state
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Check if user is Director
  const isDirector = user?.role === 'DIRECTOR';

  useEffect(() => {
    fetchSalaries();
    fetchStats();
  }, [selectedMonth, selectedYear, selectedRole, selectedStatus]);

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const params: any = {
        month: selectedMonth,
        year: selectedYear
      };
      if (selectedRole) params.workerRole = selectedRole;
      if (selectedStatus) params.status = selectedStatus;

      const response = await api.get('/salary', { params });
      setSalaries(response.data.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch salaries');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/salary/stats', {
        params: { month: selectedMonth, year: selectedYear }
      });
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const handleApprove = async () => {
    if (!selectedSalary) return;
    try {
      await api.post(`/salary/${selectedSalary._id}/approve`);
      
      // Show success notification
      setSuccessMessage(`✅ Salary approved successfully for ${selectedSalary.workerName}`);
      setShowSuccessNotification(true);
      setTimeout(() => setShowSuccessNotification(false), 5000);
      
      // Show toast notification
      toast.success(`Salary approved for ${selectedSalary.workerName}`, {
        duration: 4000,
        icon: '✅',
        style: {
          background: '#10B981',
          color: '#fff',
          fontWeight: '600',
        },
      });
      
      setShowApproveModal(false);
      setSelectedSalary(null);
      fetchSalaries();
      fetchStats();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to approve salary';
      toast.error(errorMsg, {
        duration: 4000,
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      });
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedSalary || !paymentMethod) return;
    try {
      await api.post(`/salary/${selectedSalary._id}/mark-paid`, {
        paymentMethod,
        paymentReference
      });
      
      // Show success notification
      setSuccessMessage(`💰 Salary marked as paid for ${selectedSalary.workerName}`);
      setShowSuccessNotification(true);
      setTimeout(() => setShowSuccessNotification(false), 5000);
      
      // Show toast notification
      toast.success(`Payment recorded for ${selectedSalary.workerName}`, {
        duration: 4000,
        icon: '💰',
        style: {
          background: '#3B82F6',
          color: '#fff',
          fontWeight: '600',
        },
      });
      
      setShowPaidModal(false);
      setSelectedSalary(null);
      setPaymentMethod('');
      setPaymentReference('');
      fetchSalaries();
      fetchStats();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to mark salary as paid';
      toast.error(errorMsg, {
        duration: 4000,
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      });
    }
  };

  const handleAddDeduction = async () => {
    if (!selectedSalary || !deductionType || !deductionAmount || !deductionReason) return;
    try {
      await api.post(`/salary/${selectedSalary._id}/deduction`, {
        type: deductionType,
        amount: parseFloat(deductionAmount),
        reason: deductionReason
      });
      setShowDeductionModal(false);
      setSelectedSalary(null);
      setDeductionType('');
      setDeductionAmount('');
      setDeductionReason('');
      fetchSalaries();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add deduction');
    }
  };

  const handleDelete = async () => {
    if (!selectedSalary || !deleteReason) return;
    try {
      await api.delete(`/salary/${selectedSalary._id}`, {
        data: { reason: deleteReason }
      });
      setShowDeleteModal(false);
      setSelectedSalary(null);
      setDeleteReason('');
      fetchSalaries();
      fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete salary');
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

  if (!isDirector) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Ban size={20} />
            <p className="font-semibold">Access Denied</p>
          </div>
          <p className="text-sm mt-1">Only Directors can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Toast Notifications */}
      <Toaster position="top-right" />
      
      {/* Success Notification Banner */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 max-w-md">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{successMessage}</p>
            </div>
            <button
              onClick={() => setShowSuccessNotification(false)}
              className="flex-shrink-0 hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Salary Management</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Full control over worker salaries (Director Access)</p>
        </div>
        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-green-200">
          <CheckCircle size={18} className="sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm font-medium">Director Authorized</span>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Workers</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{stats.totalWorkers}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-2 sm:p-3">
                <Users className="text-blue-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Base Salary</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.totalBaseSalary)}
                </p>
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
              </div>
              <div className="bg-red-100 rounded-full p-2 sm:p-3">
                <TrendingUp className="text-red-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Net Salary</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(stats.totalNetSalary)}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-2 sm:p-3">
                <DollarSign className="text-green-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Filter size={18} className="text-gray-600 sm:w-5 sm:h-5" />
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Filters</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Salaries Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Salary
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allowances
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Salary
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Loading salaries...
                  </td>
                </tr>
              ) : salaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No salary records found for {months[selectedMonth - 1]} {selectedYear}
                  </td>
                </tr>
              ) : (
                salaries.map((salary) => (
                  <tr key={salary._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{salary.workerName}</div>
                      <div className="text-xs text-gray-500">
                        {months[salary.month - 1]} {salary.year}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(salary.workerRole)}`}>
                        {salary.workerRole.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(salary.baseSalary)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">
                      +{formatCurrency(salary.totalAllowances)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600">
                      -{formatCurrency(salary.totalDeductions)}
                      <button
                        onClick={() => {
                          setSelectedSalary(salary);
                          setShowDeductionModal(true);
                        }}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                        title="Add Deduction"
                      >
                        <Plus size={14} />
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(salary.netSalary)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(salary.status)}`}>
                        {salary.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {salary.status === 'PENDING' && (
                          <button
                            onClick={() => {
                              setSelectedSalary(salary);
                              setShowApproveModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        {salary.status === 'APPROVED' && (
                          <button
                            onClick={() => {
                              setSelectedSalary(salary);
                              setShowPaidModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Mark as Paid"
                          >
                            <DollarSign size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedSalary(salary);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500">
            Loading salaries...
          </div>
        ) : salaries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500">
            No salary records found for {months[selectedMonth - 1]} {selectedYear}
          </div>
        ) : (
          salaries.map((salary) => (
            <div key={salary._id} className="bg-white rounded-lg shadow p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{salary.workerName}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${getRoleBadge(salary.workerRole)}`}>
                    {salary.workerRole.replace('_', ' ')}
                  </span>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(salary.status)}`}>
                  {salary.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Base Salary</p>
                  <p className="font-medium">{formatCurrency(salary.baseSalary)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Net Salary</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(salary.netSalary)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Allowances</p>
                  <p className="text-green-600">+{formatCurrency(salary.totalAllowances)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Deductions</p>
                  <p className="text-red-600">-{formatCurrency(salary.totalDeductions)}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-xs text-gray-500">{months[salary.month - 1]} {salary.year}</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedSalary(salary);
                      setShowDeductionModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Add Deduction"
                  >
                    <Plus size={18} />
                  </button>
                  {salary.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        setSelectedSalary(salary);
                        setShowApproveModal(true);
                      }}
                      className="text-green-600 hover:text-green-900 p-1"
                      title="Approve"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  {salary.status === 'APPROVED' && (
                    <button
                      onClick={() => {
                        setSelectedSalary(salary);
                        setShowPaidModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Mark as Paid"
                    >
                      <DollarSign size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedSalary(salary);
                      setShowDeleteModal(true);
                    }}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Approve Modal - Enhanced */}
      {showApproveModal && selectedSalary && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 transform transition-all animate-scale-in">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center gap-3 text-white">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Approve Salary</h3>
                  <p className="text-sm text-green-50">Authorize payment for this worker</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-3">You are approving salary for:</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Worker:</span>
                    <span className="font-bold text-gray-900">{selectedSalary.workerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Role:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(selectedSalary.workerRole)}`}>
                      {selectedSalary.workerRole}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Period:</span>
                    <span className="font-semibold text-gray-900">{months[selectedSalary.month - 1]} {selectedSalary.year}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-300">
                    <span className="text-gray-500 text-sm">Net Amount:</span>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(selectedSalary.netSalary)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    By approving, this salary will be marked as APPROVED and ready for payment processing.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedSalary(null);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  Approve Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      {showPaidModal && selectedSalary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Mark as Paid</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select method</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Reference (Optional)
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g., Transaction ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPaidModal(false);
                  setSelectedSalary(null);
                  setPaymentMethod('');
                  setPaymentReference('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={!paymentMethod}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Mark Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Deduction Modal */}
      {showDeductionModal && selectedSalary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Deduction</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deduction Type *
                </label>
                <select
                  value={deductionType}
                  onChange={(e) => setDeductionType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type</option>
                  <option value="OFFENCE">Offence</option>
                  <option value="DAMAGE">Damage</option>
                  <option value="ABSENCE">Absence</option>
                  <option value="LATE_REPORTING">Late Reporting</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₦) *
                </label>
                <input
                  type="number"
                  value={deductionAmount}
                  onChange={(e) => setDeductionAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason *
                </label>
                <textarea
                  value={deductionReason}
                  onChange={(e) => setDeductionReason(e.target.value)}
                  placeholder="Explain the deduction..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeductionModal(false);
                  setSelectedSalary(null);
                  setDeductionType('');
                  setDeductionAmount('');
                  setDeductionReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDeduction}
                disabled={!deductionType || !deductionAmount || !deductionReason}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Add Deduction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedSalary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Delete Salary Record</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete the salary for <strong>{selectedSalary.workerName}</strong>?
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Deletion *
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Explain why you're deleting this record..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedSalary(null);
                  setDeleteReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!deleteReason}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryManagement;
