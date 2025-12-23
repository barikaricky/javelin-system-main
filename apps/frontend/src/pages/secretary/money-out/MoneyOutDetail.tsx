import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Edit, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../../lib/api';

const MoneyOutDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecord();
  }, [id]);

  const loadRecord = async () => {
    try {
      const response = await api.get(`/money-out/${id}`);
      setRecord(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load record');
      navigate('/secretary/money-out');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL': return <Clock className="text-yellow-600" size={24} />;
      case 'APPROVED': return <CheckCircle className="text-green-600" size={24} />;
      case 'REJECTED': return <XCircle className="text-red-600" size={24} />;
      case 'PAID': return <CheckCircle className="text-blue-600" size={24} />;
      default: return null;
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!record) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/secretary/money-out')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Money Out Details</h1>
        </div>
        {record.approvalStatus === 'PENDING_APPROVAL' && (
          <button
            onClick={() => navigate(`/secretary/money-out/edit/${id}`)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Edit size={18} className="mr-2" />
            Edit
          </button>
        )}
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(record.approvalStatus)}
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-bold">{record.approvalStatus.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Amount</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(record.amount)}</p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Category</label>
            <p className="text-base font-semibold mt-1">{record.category.replace(/_/g, ' ')}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Payment Date</label>
            <p className="text-base font-semibold mt-1">{new Date(record.paymentDate).toLocaleDateString()}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Beneficiary Type</label>
            <p className="text-base font-semibold mt-1">{record.beneficiaryType.replace(/_/g, ' ')}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Beneficiary Name</label>
            <p className="text-base font-semibold mt-1">{record.beneficiaryName}</p>
          </div>
          
          {record.beneficiaryAccount && (
            <div>
              <label className="text-sm font-medium text-gray-500">Account Number</label>
              <p className="text-base font-semibold mt-1">{record.beneficiaryAccount}</p>
            </div>
          )}
          
          {record.beneficiaryBank && (
            <div>
              <label className="text-sm font-medium text-gray-500">Bank Name</label>
              <p className="text-base font-semibold mt-1">{record.beneficiaryBank}</p>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium text-gray-500">Payment Method</label>
            <p className="text-base font-semibold mt-1">{record.paymentMethod.replace(/_/g, ' ')}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Requested By</label>
            <p className="text-base font-semibold mt-1">
              {record.requestedById?.firstName} {record.requestedById?.lastName}
            </p>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-500">Purpose / Description</label>
          <p className="text-base mt-1 p-3 bg-gray-50 rounded-lg">{record.purpose}</p>
        </div>
        
        {record.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <label className="text-sm font-medium text-red-700">Rejection Reason</label>
            <p className="text-base mt-1 text-red-600">{record.rejectionReason}</p>
          </div>
        )}
        
        {/* Edit History */}
        {record.editHistory && record.editHistory.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">Edit History</h3>
            <div className="space-y-3">
              {record.editHistory.map((edit: any, index: number) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg text-sm">
                  <p className="font-medium">
                    {new Date(edit.editedAt).toLocaleString()} - {edit.editedById?.firstName} {edit.editedById?.lastName}
                  </p>
                  <p className="text-gray-600">Reason: {edit.reason}</p>
                  {edit.previousAmount && (
                    <p className="text-gray-600">
                      Amount changed from {formatCurrency(edit.previousAmount)} to {formatCurrency(edit.newAmount)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Documents */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-3">Documents</h3>
          <div className="flex space-x-4">
            {record.supportingDocument && (
              <a
                href={record.supportingDocument}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
              >
                <FileText size={18} className="mr-2" />
                Supporting Document
              </a>
            )}
            {record.paymentProof && (
              <a
                href={record.paymentProof}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
              >
                <FileText size={18} className="mr-2" />
                Payment Proof
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoneyOutDetail;
