import { useState, useEffect } from 'react';
import {
  DollarSign,
  Users,
  TrendingUp,
  Download,
  Search,
  Filter,
  Eye,
  Calendar,
  CreditCard,
  Building2,
  UserCheck,
  Shield,
} from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface SalaryRecord {
  id: string;
  employeeId: string;
  fullName: string;
  role: string;
  salary: number;
  salaryCategory: string;
  bankName: string;
  bankAccountNumber: string;
  status: string;
  region?: string;
  supervisorType?: string;
}

interface SalaryStats {
  totalEmployees: number;
  totalMonthlySalary: number;
  totalAnnualSalary: number;
  byRole: {
    role: string;
    count: number;
    totalSalary: number;
  }[];
}

export default function SalaryPanelPage() {
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [stats, setStats] = useState<SalaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    fetchSalaryData();
  }, []);

  const fetchSalaryData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/managers/salary-panel');
      setSalaries(response.data.salaries);
      setStats(response.data.stats);
    } catch (error: any) {
      console.error('Failed to fetch salary data:', error);
      toast.error('Failed to load salary data');
    } finally {
      setLoading(false);
    }
  };

  const filteredSalaries = salaries.filter(salary => {
    const matchesSearch = 
      salary.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salary.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || salary.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const exportToCSV = () => {
    const headers = ['Employee ID', 'Name', 'Role', 'Salary', 'Bank Name', 'Account Number', 'Status'];
    const rows = filteredSalaries.map(s => [
      s.employeeId,
      s.fullName,
      s.role,
      s.salary.toLocaleString(),
      s.bankName,
      s.bankAccountNumber,
      s.status,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Salary report exported successfully');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'GENERAL_SUPERVISOR': return <Shield className="w-5 h-5" />;
      case 'SUPERVISOR': return <UserCheck className="w-5 h-5" />;
      case 'OPERATOR': return <Users className="w-5 h-5" />;
      case 'SECRETARY': return <Building2 className="w-5 h-5" />;
      default: return <Users className="w-5 h-5" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'GENERAL_SUPERVISOR': return 'General Supervisor';
      case 'SUPERVISOR': return 'Supervisor';
      case 'OPERATOR': return 'Operator';
      case 'SECRETARY': return 'Secretary';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading salary data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Salary Panel</h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-600">View and manage salary information for all staff members</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <TrendingUp className="text-white/60 w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-white/80 text-xs sm:text-sm font-medium mb-1">Total Employees</h3>
            <p className="text-2xl sm:text-3xl font-bold">{stats.totalEmployees}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <Calendar className="text-white/60 w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-white/80 text-xs sm:text-sm font-medium mb-1">Monthly Salary</h3>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold">₦{stats.totalMonthlySalary.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <TrendingUp className="text-white/60 w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-white/80 text-xs sm:text-sm font-medium mb-1">Annual Salary</h3>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold">₦{stats.totalAnnualSalary.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Breakdown by Role */}
      {stats && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Salary Breakdown by Role</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.byRole.map((roleData) => (
              <div key={roleData.role} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                    {getRoleIcon(roleData.role)}
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">{getRoleName(roleData.role)}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{roleData.count} employees</p>
                  </div>
                </div>
                <div className="pt-2 sm:pt-3 border-t border-gray-200">
                  <p className="text-xs sm:text-sm text-gray-600">Total Monthly</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">₦{roleData.totalSalary.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search by name or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <div className="relative flex-1 sm:flex-none sm:w-40">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-8 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white"
              >
                <option value="ALL">All Roles</option>
                <option value="GENERAL_SUPERVISOR">General Supervisor</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="OPERATOR">Operator</option>
                <option value="SECRETARY">Secretary</option>
              </select>
            </div>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium whitespace-nowrap"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Salary Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Salary
                </th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Bank Details
                </th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSalaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-lg font-medium">No salary records found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSalaries.map((salary) => (
                  <tr key={salary.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{salary.fullName}</p>
                        <p className="text-sm text-gray-500">{salary.employeeId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                          {getRoleIcon(salary.role)}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {getRoleName(salary.role)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">₦{salary.salary.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">per month</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {salary.salaryCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{salary.bankName}</p>
                        <p className="text-sm text-gray-500">{salary.bankAccountNumber}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          salary.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {salary.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1"
                      >
                        <Eye size={16} />
                        View
                      </button>
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
        {filteredSalaries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-base font-medium">No salary records found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredSalaries.map((salary) => (
            <div key={salary.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{salary.fullName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{salary.employeeId}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    salary.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {salary.status}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                  {getRoleIcon(salary.role)}
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {getRoleName(salary.role)}
                </span>
                <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {salary.salaryCategory}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Monthly Salary</p>
                  <p className="text-sm font-semibold text-gray-900">₦{salary.salary.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Bank</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{salary.bankName}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Account Number</p>
                <p className="text-sm font-mono text-gray-900">{salary.bankAccountNumber}</p>
              </div>

              <button className="mt-3 w-full text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center justify-center gap-1 py-2 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors">
                <Eye size={16} />
                View Details
              </button>
            </div>
          ))
        )}
      </div>

      {/* Summary Footer */}
      {filteredSalaries.length > 0 && (
        <div className="mt-4 sm:mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="text-center sm:text-left">
              <p className="text-xs sm:text-sm text-emerald-700 font-medium">Filtered Results</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-900">{filteredSalaries.length} Employees</p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-emerald-700 font-medium">Total Monthly Salary</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-900">
                ₦{filteredSalaries.reduce((sum, s) => sum + s.salary, 0).toLocaleString()}
              </p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xs sm:text-sm text-emerald-700 font-medium">Total Annual Salary</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-900">
                ₦{(filteredSalaries.reduce((sum, s) => sum + s.salary, 0) * 12).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
