import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, DollarSign, Calendar, Download, PieChart, Trash2, ArrowUpDown, TrendingUp, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../../lib/api';
import MoneyOutCharts from '../../secretary/money-out/MoneyOutCharts';

const MoneyOutReports: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCharts, setShowCharts] = useState(true);
  const [actionModal, setActionModal] = useState<{type: string; record: any} | null>(null);
  const [reason, setReason] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'beneficiary' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recordsRes, statsRes] = await Promise.all([
        api.get('/money-out'),
        api.get('/money-out/stats')
      ]);
      setRecords(recordsRes.data.data);
      setStats(statsRes.data.data);
    } catch (error: any) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/money-out/${id}/approve`);
      toast.success('Request approved');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!reason || reason.length < 10) {
      toast.error('Rejection reason must be at least 10 characters');
      return;
    }
    try {
      await api.post(`/money-out/${actionModal?.record._id}/reject`, { rejectionReason: reason });
      toast.success('Request rejected');
      setActionModal(null);
      setReason('');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject');
    }
  };

  const handleDelete = async () => {
    if (!reason || reason.length < 10) {
      toast.error('Deletion reason must be at least 10 characters');
      return;
    }
    try {
      await api.delete(`/money-out/${actionModal?.record._id}`, { data: { deletionReason: reason } });
      toast.success('Record deleted');
      setActionModal(null);
      setReason('');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  const exportCSV = async () => {
    try {
      const response = await api.get('/money-out/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `money-out-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV exported');
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  // Get unique categories and statuses for filters
  const categories = Array.from(new Set(records.map((r: any) => r.category)));
  const statuses = Array.from(new Set(records.map((r: any) => r.approvalStatus)));

  // Sort and filter records
  const sortedAndFilteredRecords = [...records]
    .filter((record: any) => {
      const matchesCategory = filterCategory === 'all' || record.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || record.approvalStatus === filterStatus;
      return matchesCategory && matchesStatus;
    })
    .sort((a: any, b: any) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'beneficiary':
          comparison = a.beneficiaryName.localeCompare(b.beneficiaryName);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: 'date' | 'amount' | 'beneficiary' | 'category') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Money Out Reports</h1>
          <p className="text-sm text-gray-600 mt-1">Track and manage all expense reports</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-xs sm:text-sm font-medium shadow-sm hover:shadow"
          >
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span>{showCharts ? 'Hide' : 'Show'} Charts</span>
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-xs sm:text-sm font-medium shadow-sm hover:shadow-md"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Stats Cards with animation */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-4 sm:p-5 hover:shadow-lg transition-all transform hover:-translate-y-1 animate-slide-up" style={{animationDelay: '0ms'}}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-blue-700 font-medium">Total Amount</p>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900">{formatCurrency(stats.totalAmount)}</p>
            <p className="text-xs text-blue-600 mt-1">All expenses</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-4 sm:p-5 hover:shadow-lg transition-all transform hover:-translate-y-1 animate-slide-up" style={{animationDelay: '100ms'}}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-green-700 font-medium">Paid Amount</p>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-900">{formatCurrency(stats.paidAmount)}</p>
            <p className="text-xs text-green-600 mt-1">Approved & paid</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-md p-4 sm:p-5 hover:shadow-lg transition-all transform hover:-translate-y-1 animate-slide-up" style={{animationDelay: '200ms'}}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-yellow-700 font-medium">Pending</p>
              <Calendar className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-900">{stats.pendingApproval}</p>
            <p className="text-xs text-yellow-600 mt-1">Awaiting approval</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-4 sm:p-5 hover:shadow-lg transition-all transform hover:-translate-y-1 animate-slide-up" style={{animationDelay: '300ms'}}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-purple-700 font-medium">Total Records</p>
              <PieChart className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-900">{stats.totalRecords}</p>
            <p className="text-xs text-purple-600 mt-1">All time</p>
          </div>
        </div>
      )}

      {/* Charts with transition */}
      {showCharts && records.length > 0 && (
        <div className="mb-4 sm:mb-6 animate-fade-in">
          <MoneyOutCharts records={records} />
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-4 animate-slide-up">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Filter by Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">All Categories</option>
                {categories.map((cat: any) => (
                  <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">All Statuses</option>
                {statuses.map((status: any) => (
                  <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-end gap-2">
            <div className="flex-1 lg:flex-none lg:w-48">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="beneficiary">Beneficiary</option>
                <option value="category">Category</option>
              </select>
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <ArrowUpDown className={`w-5 h-5 text-gray-700 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {(filterCategory !== 'all' || filterStatus !== 'all') && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Active filters:</span>
            {filterCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                {filterCategory.replace(/_/g, ' ')}
                <button onClick={() => setFilterCategory('all')} className="hover:text-blue-900">×</button>
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                {filterStatus.replace(/_/g, ' ')}
                <button onClick={() => setFilterStatus('all')} className="hover:text-green-900">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Records Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden animate-slide-up">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <button onClick={() => handleSort('date')} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                    Date
                    {sortBy === 'date' && <ArrowUpDown className={`w-3 h-3 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />}
                  </button>
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <button onClick={() => handleSort('category')} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                    Category
                    {sortBy === 'category' && <ArrowUpDown className={`w-3 h-3 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />}
                  </button>
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <button onClick={() => handleSort('beneficiary')} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                    Beneficiary
                    {sortBy === 'beneficiary' && <ArrowUpDown className={`w-3 h-3 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />}
                  </button>
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <button onClick={() => handleSort('amount')} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                    Amount
                    {sortBy === 'amount' && <ArrowUpDown className={`w-3 h-3 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />}
                  </button>
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedAndFilteredRecords.map((record: any, index: number) => (
                <tr 
                  key={record._id} 
                  className="hover:bg-blue-50 transition-all duration-200 animate-fade-in"
                  style={{animationDelay: `${index * 30}ms`}}
                >
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(record.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {record.category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{record.beneficiaryName}</td>
                  <td className="px-4 py-4 text-sm font-bold text-gray-900">{formatCurrency(record.amount)}</td>
                  <td className="px-4 py-4 text-sm">
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                      record.approvalStatus === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600/20' :
                      record.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-800 ring-1 ring-green-600/20' :
                      record.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-800 ring-1 ring-red-600/20' :
                      'bg-blue-100 text-blue-800 ring-1 ring-blue-600/20'
                    }`}>
                      {record.approvalStatus.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex justify-center space-x-2">
                      {record.approvalStatus === 'PENDING_APPROVAL' && (
                        <>
                          <button
                            onClick={() => handleApprove(record._id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all transform hover:scale-110"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => setActionModal({type: 'reject', record})}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all transform hover:scale-110"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setActionModal({type: 'delete', record})}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all transform hover:scale-110"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedAndFilteredRecords.length === 0 && (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No records match your filters</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {sortedAndFilteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No records match your filters</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria</p>
          </div>
        ) : (
          sortedAndFilteredRecords.map((record: any, index: number) => (
            <div 
              key={record._id} 
              className="bg-white rounded-xl shadow-md border border-gray-200 p-4 hover:shadow-lg transition-all transform hover:-translate-y-0.5 animate-slide-up"
              style={{animationDelay: `${index * 50}ms`}}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(record.amount)}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(record.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  record.approvalStatus === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                  record.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  record.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {record.approvalStatus.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="space-y-2 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="text-sm font-medium text-gray-900">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-gray-100">
                      {record.category.replace(/_/g, ' ')}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Beneficiary</p>
                  <p className="text-sm font-semibold text-gray-900">{record.beneficiaryName}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                {record.approvalStatus === 'PENDING_APPROVAL' && (
                  <>
                    <button
                      onClick={() => handleApprove(record._id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all text-sm font-medium"
                      title="Approve"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => setActionModal({type: 'reject', record})}
                      className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all text-sm font-medium"
                      title="Reject"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => setActionModal({type: 'delete', record})}
                  className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all text-sm font-medium"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Modal with animations */}
      {actionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl animate-scale-in transform">
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              {actionModal.type === 'reject' ? 'Reject Request' : 'Delete Record'}
            </h3>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600 mb-1">Amount:</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(actionModal.record.amount)}</p>
              <p className="text-sm text-gray-600 mt-2">{actionModal.record.beneficiaryName}</p>
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason (minimum 10 characters)..."
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setActionModal(null); setReason(''); }}
                className="px-5 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={actionModal.type === 'reject' ? handleReject : handleDelete}
                className="px-5 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg"
              >
                {actionModal.type === 'reject' ? 'Reject' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyOutReports;
