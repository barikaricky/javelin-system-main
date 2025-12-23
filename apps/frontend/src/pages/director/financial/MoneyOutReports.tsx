import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, DollarSign, Calendar, Download, PieChart, Trash2 } from 'lucide-react';
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

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Money Out Reports</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="flex items-center px-3 py-2 border rounded-lg hover:bg-gray-50 text-xs sm:text-sm"
          >
            <PieChart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Charts</span>
            <span className="sm:hidden">Charts</span>
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600">Total Amount</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-600">{formatCurrency(stats.totalAmount)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600">Paid Amount</p>
            <p className="text-lg sm:text-2xl font-bold text-green-600">{formatCurrency(stats.paidAmount)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600">Pending Approval</p>
            <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pendingApproval}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600">Total Records</p>
            <p className="text-lg sm:text-2xl font-bold">{stats.totalRecords}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      {showCharts && records.length > 0 && (
        <div className="mb-4 sm:mb-6">
          <MoneyOutCharts records={records} />
        </div>
      )}

      {/* Records Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beneficiary</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.map((record: any) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{new Date(record.paymentDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">{record.category.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-sm">{record.beneficiaryName}</td>
                  <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(record.amount)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      record.approvalStatus === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                      record.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      record.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {record.approvalStatus.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center space-x-2">
                      {record.approvalStatus === 'PENDING_APPROVAL' && (
                        <>
                          <button
                            onClick={() => handleApprove(record._id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => setActionModal({type: 'reject', record})}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setActionModal({type: 'delete', record})}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
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
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {records.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500 text-sm">
            No records found
          </div>
        ) : (
          records.map((record: any) => (
            <div key={record._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(record.amount)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(record.paymentDate).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
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
                  <p className="text-sm font-medium text-gray-900">{record.category.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Beneficiary</p>
                  <p className="text-sm font-medium text-gray-900">{record.beneficiaryName}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                {record.approvalStatus === 'PENDING_APPROVAL' && (
                  <>
                    <button
                      onClick={() => handleApprove(record._id)}
                      className="text-green-600 hover:bg-green-50 rounded p-1"
                      title="Approve"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActionModal({type: 'reject', record})}
                      className="text-red-600 hover:bg-red-50 rounded p-1"
                      title="Reject"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setActionModal({type: 'delete', record})}
                  className="text-red-600 hover:bg-red-50 rounded p-1"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
              {actionModal.type === 'reject' ? 'Reject Request' : 'Delete Record'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              Amount: {formatCurrency(actionModal.record.amount)} - {actionModal.record.beneficiaryName}
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason (minimum 10 characters)..."
              className="w-full px-3 sm:px-4 py-2 text-sm border rounded-lg mb-3 sm:mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-2 sm:gap-3">
              <button
                onClick={() => { setActionModal(null); setReason(''); }}
                className="px-3 sm:px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={actionModal.type === 'reject' ? handleReject : handleDelete}
                className="px-3 sm:px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
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
