import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, DollarSign, Calendar, Building2, FileText,
  Edit2, Clock, User, History, Download
} from 'lucide-react';
import { api } from '../../../lib/api';

interface MoneyInRecord {
  _id: string;
  amount: number;
  transactionDate: string;
  source: string;
  paymentMethod: string;
  description: string;
  clientId?: { _id: string; clientName: string; companyName?: string };
  invoiceId?: { _id: string; invoiceNumber: string; status: string; amount: number };
  recordedById: { firstName: string; lastName: string; email: string };
  referenceNumber?: string;
  receiptNumber?: string;
  bankName?: string;
  notes?: string;
  category?: string;
  attachments: string[];
  editHistory?: Array<{
    editedAt: string;
    editedById: { firstName: string; lastName: string };
    changes: Array<{ field: string; oldValue: any; newValue: any }>;
    reason?: string;
  }>;
  isClassified: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MoneyInDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<MoneyInRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    try {
      const response = await api.get(`/money-in/${id}`);
      setRecord(response.data.data);
    } catch (error) {
      console.error('Failed to fetch record:', error);
      toast.error('Failed to load Money In record');
      navigate('/secretary/money-in');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!record) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/secretary/money-in')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Money In Details</h1>
            <p className="text-sm text-gray-600 mt-1">
              Recorded on {formatDate(record.createdAt)}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/secretary/money-in/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </button>
      </div>

      {/* Amount Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-sm mb-2">Total Amount</p>
            <p className="text-4xl font-bold">₦{record.amount.toLocaleString()}</p>
            <p className="text-emerald-100 mt-2">
              via {record.paymentMethod.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-emerald-100 text-sm">Transaction Date</p>
            <p className="text-lg font-semibold mt-1">
              {new Date(record.transactionDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source & Client */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Source Information
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Source</p>
              <p className="font-medium text-gray-900">{record.source.replace(/_/g, ' ')}</p>
            </div>
            {record.clientId && (
              <div>
                <p className="text-sm text-gray-600">Client</p>
                <p className="font-medium text-gray-900">
                  {record.clientId.companyName || record.clientId.clientName}
                </p>
              </div>
            )}
            {record.invoiceId && (
              <div>
                <p className="text-sm text-gray-600">Invoice</p>
                <p className="font-medium text-gray-900">
                  {record.invoiceId.invoiceNumber}
                </p>
                <p className="text-xs text-gray-500">
                  Status: {record.invoiceId.status} | Amount: ₦{record.invoiceId.amount.toLocaleString()}
                </p>
              </div>
            )}
            {record.category && (
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-medium text-gray-900">{record.category}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Payment Details
          </h3>
          <div className="space-y-3">
            {record.referenceNumber && (
              <div>
                <p className="text-sm text-gray-600">Reference Number</p>
                <p className="font-medium text-gray-900 font-mono">{record.referenceNumber}</p>
              </div>
            )}
            {record.receiptNumber && (
              <div>
                <p className="text-sm text-gray-600">Receipt Number</p>
                <p className="font-medium text-gray-900 font-mono">{record.receiptNumber}</p>
              </div>
            )}
            {record.bankName && (
              <div>
                <p className="text-sm text-gray-600">Bank Name</p>
                <p className="font-medium text-gray-900">{record.bankName}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description & Notes */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          Description & Notes
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Description</p>
            <p className="text-gray-900">{record.description}</p>
          </div>
          {record.notes && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Additional Notes</p>
              <p className="text-gray-900">{record.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Attachments */}
      {record.attachments && record.attachments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-600" />
            Evidence/Receipts ({record.attachments.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {record.attachments.map((attachment, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 text-center hover:border-emerald-500 transition-colors cursor-pointer"
                onClick={() => window.open(attachment, '_blank')}
              >
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Evidence {index + 1}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit History */}
      {record.editHistory && record.editHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            Edit History ({record.editHistory.length})
          </h3>
          <div className="space-y-4">
            {record.editHistory.map((edit, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Edited by {edit.editedById.firstName} {edit.editedById.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(edit.editedAt)}</p>
                  </div>
                </div>
                {edit.reason && (
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Reason:</span> {edit.reason}
                  </p>
                )}
                <div className="space-y-1">
                  {edit.changes.map((change, changeIndex) => (
                    <div key={changeIndex} className="text-xs bg-gray-50 p-2 rounded">
                      <span className="font-medium">{change.field}:</span>{' '}
                      <span className="text-red-600">{JSON.stringify(change.oldValue)}</span>
                      {' → '}
                      <span className="text-emerald-600">{JSON.stringify(change.newValue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600" />
          Record Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Recorded By</p>
            <p className="font-medium text-gray-900">
              {record.recordedById.firstName} {record.recordedById.lastName}
            </p>
            <p className="text-xs text-gray-500">{record.recordedById.email}</p>
          </div>
          <div>
            <p className="text-gray-600">Classification Status</p>
            <p className="font-medium text-gray-900">
              {record.isClassified ? 'Classified' : 'Unclassified'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Created At</p>
            <p className="font-medium text-gray-900">{formatDate(record.createdAt)}</p>
          </div>
          <div>
            <p className="text-gray-600">Last Updated</p>
            <p className="font-medium text-gray-900">{formatDate(record.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
