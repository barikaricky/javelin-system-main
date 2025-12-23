import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  DollarSign, Calendar, Download, Trash2, AlertTriangle,
  TrendingUp, Banknote, Building2, Clock, CheckCircle,
  FileText, Eye, PieChart as PieChartIcon
} from 'lucide-react';
import { api } from '../../../lib/api';
import MoneyInCharts from '../../secretary/money-in/MoneyInCharts';

interface DailyReconciliation {
  date: string;
  totalCash: number;
  totalTransfer: number;
  totalPOS: number;
  totalCheque: number;
  totalMobile: number;
  totalOther: number;
  grandTotal: number;
  recordCount: number;
  isClosed: boolean;
  unclassifiedCount: number;
  missingEvidenceCount: number;
}

interface MoneyInRecord {
  _id: string;
  amount: number;
  transactionDate: string;
  source: string;
  paymentMethod: string;
  description: string;
  clientId?: { clientName: string; companyName?: string };
  invoiceId?: { invoiceNumber: string; status: string; amount: number; paidAmount?: number };
  isClassified: boolean;
  deletedAt?: string;
}

export default function MoneyInReports() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reconciliation, setReconciliation] = useState<DailyReconciliation | null>(null);
  const [records, setRecords] = useState<MoneyInRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showCharts, setShowCharts] = useState(true);

  useEffect(() => {
    fetchDailyReconciliation();
    fetchDayRecords();
  }, [selectedDate]);

  const fetchDailyReconciliation = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/money-in/daily-reconciliation/${selectedDate}`);
      setReconciliation(response.data.data);
    } catch (error) {
      console.error('Failed to fetch reconciliation:', error);
      toast.error('Failed to load daily reconciliation');
    } finally {
      setLoading(false);
    }
  };

  const fetchDayRecords = async () => {
    try {
      const response = await api.get(`/money-in?startDate=${selectedDate}&endDate=${selectedDate}&limit=1000`);
      setRecords(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    }
  };

  const handleDeleteClick = (recordId: string) => {
    setRecordToDelete(recordId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete || !deleteReason.trim()) {
      toast.error('Deletion reason is required');
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/money-in/${recordToDelete}`, {
        data: { reason: deleteReason }
      });
      
      toast.success('Money In record deleted and archived');
      setShowDeleteModal(false);
      setRecordToDelete(null);
      setDeleteReason('');
      fetchDailyReconciliation();
      fetchDayRecords();
    } catch (error: any) {
      console.error('Failed to delete record:', error);
      toast.error(error.response?.data?.message || 'Failed to delete record');
    } finally {
      setDeleting(false);
    }
  };

  const exportToCSV = () => {
    if (records.length === 0) {
      toast.error('No records to export');
      return;
    }

    const headers = ['Date', 'Amount', 'Payment Method', 'Source', 'Client', 'Invoice', 'Description', 'Reference', 'Status'];
    const rows = records.map(r => [
      new Date(r.transactionDate).toLocaleDateString(),
      r.amount,
      r.paymentMethod,
      r.source,
      r.clientId?.companyName || r.clientId?.clientName || '',
      r.invoiceId?.invoiceNumber || '',
      r.description,
      '',
      r.isClassified ? 'Classified' : 'Unclassified'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `money-in-${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  // Check for invoice mismatches
  const invoiceMismatches = records.filter(r => {
    if (!r.invoiceId) return false;
    const totalPaid = (r.invoiceId.paidAmount || 0);
    return totalPaid > r.invoiceId.amount;
  });

  if (loading && !reconciliation) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-emerald-600" />
            Money In Reports
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Daily reconciliation and financial oversight
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className={`flex items-center px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              showCharts 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <PieChartIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{showCharts ? 'Hide' : 'Show'} Charts</span>
            <span className="sm:hidden">Charts</span>
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs sm:text-sm font-medium"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </button>
          <button
            onClick={() => navigate('/director/money-in/record')}
            className="flex items-center px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs sm:text-sm font-medium"
          >
            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Record Money In</span>
            <span className="sm:hidden">Record</span>
          </button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full sm:w-auto px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
          />
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Today
          </button>
        </div>
      </div>

      {/* Charts Section */}
      {showCharts && records.length > 0 && (
        <MoneyInCharts records={records} />
      )}

      {/* Invoice Mismatch Alerts */}
      {invoiceMismatches.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-red-900">Invoice Payment Mismatches Detected</h3>
              <p className="text-xs sm:text-sm text-red-700 mt-1">
                {invoiceMismatches.length} invoice(s) have been overpaid and require Director review
              </p>
              <div className="mt-2 sm:mt-3 space-y-2">
                {invoiceMismatches.map(record => (
                  <div key={record._id} className="text-xs sm:text-sm bg-white rounded p-2">
                    <span className="font-medium">{record.invoiceId?.invoiceNumber}</span> - 
                    Invoice: ₦{record.invoiceId?.amount.toLocaleString()}, 
                    Paid: ₦{record.invoiceId?.paidAmount?.toLocaleString()}, 
                    Overpayment: ₦{((record.invoiceId?.paidAmount || 0) - (record.invoiceId?.amount || 0)).toLocaleString()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day Status Banner */}
      {reconciliation && (
        <div className={`rounded-xl p-3 sm:p-4 ${
          reconciliation.isClosed 
            ? 'bg-emerald-50 border border-emerald-200' 
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              {reconciliation.isClosed ? (
                <>
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-emerald-900">Day Closed</p>
                    <p className="text-xs sm:text-sm text-emerald-700">All records classified with evidence</p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-amber-900">Day Not Closed</p>
                    <p className="text-xs sm:text-sm text-amber-700">
                      {reconciliation.unclassifiedCount} unclassified, {reconciliation.missingEvidenceCount} missing evidence
                    </p>
                  </div>
                </>
              )}
            </div>
            {reconciliation.recordCount > 0 && (
              <p className="text-xs sm:text-sm font-medium">
                {reconciliation.recordCount} transaction{reconciliation.recordCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Reconciliation Summary */}
      {reconciliation && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-600">Grand Total</p>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              ₦{reconciliation.grandTotal.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-600">Cash</p>
              <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
              ₦{reconciliation.totalCash.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {reconciliation.grandTotal > 0 
                ? Math.round((reconciliation.totalCash / reconciliation.grandTotal) * 100)
                : 0}% of total
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-600">Bank Transfer</p>
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
              ₦{reconciliation.totalTransfer.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {reconciliation.grandTotal > 0 
                ? Math.round((reconciliation.totalTransfer / reconciliation.grandTotal) * 100)
                : 0}% of total
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-amber-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-600">Other Methods</p>
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
              ₦{(reconciliation.totalPOS + reconciliation.totalCheque + reconciliation.totalMobile + reconciliation.totalOther).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              POS, Cheque, Mobile Money
            </p>
          </div>
        </div>
      )}

      {/* Records Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">Transactions for {new Date(selectedDate).toLocaleDateString()}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source/Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No transactions recorded for this date
                  </td>
                </tr>
              ) : (
                records.map(record => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-semibold text-emerald-600">
                        ₦{record.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {record.paymentMethod.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {record.clientId?.companyName || record.clientId?.clientName || record.source}
                        </p>
                        {record.invoiceId && (
                          <p className="text-xs text-gray-500">
                            {record.invoiceId.invoiceNumber}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.description.length > 50 
                        ? `${record.description.substring(0, 50)}...` 
                        : record.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.isClassified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle className="w-3 h-3" />
                          Classified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="w-3 h-3" />
                          Unclassified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/director/money-in/${record._id}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(record._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
        <div className="bg-white rounded-lg shadow-sm px-3 py-2 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Transactions for {new Date(selectedDate).toLocaleDateString()}</h2>
        </div>
        {records.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500 text-sm">
            No transactions recorded for this date
          </div>
        ) : (
          records.map((record: any) => (
            <div key={record._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-lg font-semibold text-emerald-600">
                    ₦{record.amount.toLocaleString()}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {record.paymentMethod.replace(/_/g, ' ')}
                  </p>
                </div>
                {record.isClassified ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle className="w-3 h-3" />
                    Classified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                    <AlertTriangle className="w-3 h-3" />
                    Unclassified
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Source/Client</p>
                  <p className="text-sm font-medium text-gray-900">
                    {record.clientId?.companyName || record.clientId?.clientName || record.source}
                  </p>
                  {record.invoiceId && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {record.invoiceId.invoiceNumber}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="text-sm text-gray-900">
                    {record.description.length > 50 
                      ? `${record.description.substring(0, 50)}...` 
                      : record.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => navigate(`/director/money-in/${record._id}`)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteClick(record._id)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4 mb-4">
              <div className="p-2 sm:p-3 bg-red-100 rounded-full flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Delete Money In Record</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  This action will archive the record. It will remain visible in audit logs.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Reason for Deletion <span className="text-red-500">*</span>
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Explain why this record needs to be deleted..."
              />
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setRecordToDelete(null);
                  setDeleteReason('');
                }}
                className="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting || !deleteReason.trim()}
                className="flex-1 px-3 sm:px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete & Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
