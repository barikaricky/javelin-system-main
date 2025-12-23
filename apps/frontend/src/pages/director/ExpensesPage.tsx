import { useState, useEffect } from 'react';
import { Receipt, Plus, TrendingUp, DollarSign, Calendar, Download, Filter } from 'lucide-react';
import ExpenseForm from '../../components/director/ExpenseForm';
import ExpenseAnalytics from '../../components/director/ExpenseAnalytics';
import { api } from '../../lib/api';

export default function ExpensesPage() {
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [_isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, locationsRes, expensesRes] = await Promise.all([
        api.get('/expenses/stats'),
        api.get('/director/locations'),
        api.get('/expenses?limit=10'),
      ]);

      setStats(statsRes.data);
      setLocations(locationsRes.data || []);
      setExpenses(expensesRes.data.expenses || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/expenses/export?format=csv', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expenses-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Receipt className="w-8 h-8 text-primary-600" />
              Expenses
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Track and analyze expenses across all locations
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2.5 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-xl transition-all flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-primary-400 to-primary-600 hover:from-primary-500 hover:to-primary-700 text-dark-900 font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Expense
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₦{stats.total.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.total.count} transactions</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary-700" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">This Month</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₦{stats.thisMonth.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.percentageChange > 0 ? '+' : ''}{stats.percentageChange.toFixed(1)}% vs last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-secondary-700" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Pending Approval</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₦{stats.pending.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.pending.count} pending</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-yellow-700" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics */}
        <ExpenseAnalytics />

        {/* Recent Expenses */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
            <span>Recent Expenses</span>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </h2>

          {expenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(expense.expenseDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {expense.location?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{expense.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{expense.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                        ₦{parseFloat(expense.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          expense.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          expense.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {expense.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Expenses Recorded</h3>
              <p className="text-gray-500 mb-4">Start tracking your expenses by adding one</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-primary-400 to-primary-600 hover:from-primary-500 hover:to-primary-700 text-dark-900 font-semibold px-6 py-3 rounded-xl transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add First Expense
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expense Form Modal */}
      {showForm && (
        <ExpenseForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            fetchData();
            setShowForm(false);
          }}
          locations={locations}
        />
      )}
    </div>
  );
}
