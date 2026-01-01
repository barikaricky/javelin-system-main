import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  Shield,
  User,
  Image as ImageIcon,
  Mic,
  Paperclip,
  AlertCircle,
  Send,
  MessageSquare,
  Eye,
  History,
  X,
  ChevronDown,
} from 'lucide-react';
import { api, getImageUrl } from '../../../lib/api';
import { toast } from 'react-hot-toast';

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileText },
  PENDING_REVIEW: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REVISION_REQUIRED: { label: 'Revision Required', color: 'bg-orange-100 text-orange-800', icon: XCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

const REPORT_TYPES = {
  DAILY_ACTIVITY: 'Daily Activity Report',
  INCIDENT: 'Incident Report',
  EMERGENCY: 'Emergency Report',
  VISITOR_LOG: 'Visitor Log Report',
  PATROL: 'Patrol Report',
  EQUIPMENT: 'Equipment / Asset Report',
  CLIENT_INSTRUCTION: 'Client Instruction Report',
  END_OF_SHIFT: 'End-of-Shift Report',
};

interface Report {
  _id: string;
  title: string;
  reportType: string;
  status: keyof typeof STATUS_CONFIG;
  priority: string;
  bitId: {
    bitName: string;
    bitCode: string;
  };
  locationId: {
    locationName: string;
    address: string;
    city: string;
    state: string;
  };
  supervisorId?: {
    userId: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  occurrenceDate: string;
  occurrenceTime: string;
  description: string;
  chronologicalNarrative?: string;
  images: Array<{
    url: string;
    filename: string;
    description?: string;
    uploadedAt: string;
  }>;
  audioRecordings: Array<{
    url: string;
    filename: string;
    duration?: number;
    transcription?: string;
    uploadedAt: string;
  }>;
  attachedFiles: Array<{
    url: string;
    filename: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
  }>;
  tags?: string[];
  auditLog: Array<{
    action: string;
    performedBy?: {
      firstName: string;
      lastName: string;
    };
    performedAt: string;
    details?: string;
  }>;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  approvedBy?: {
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  rejectionReason?: string;
  revisionNotes?: string;
  isLocked: boolean;
}

export default function ReportDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'revision' | 'reject'>('approve');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchReport();
    }
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/${id}`);
      setReport(response.data.report);
    } catch (error: any) {
      console.error('Failed to fetch report:', error);
      toast.error('Failed to load report');
      navigate('/manager/reports');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      toast.loading('Generating PDF...');
      const response = await api.get(`/reports/${id}/export`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${report?.title.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.dismiss();
      toast.success('Report exported successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export report');
    }
  };

  const handleReview = async () => {
    if (reviewAction !== 'approve' && !reviewNotes.trim()) {
      toast.error('Please provide notes for this action');
      return;
    }

    try {
      setProcessing(true);
      
      if (reviewAction === 'approve') {
        await api.post(`/reports/${id}/approve`);
        toast.success('Report approved successfully');
      } else if (reviewAction === 'revision') {
        await api.post(`/reports/${id}/revision`, { notes: reviewNotes });
        toast.success('Revision requested');
      } else if (reviewAction === 'reject') {
        await api.post(`/reports/${id}/reject`, { reason: reviewNotes });
        toast.success('Report rejected');
      }
      
      setShowReviewModal(false);
      setReviewNotes('');
      fetchReport();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process review');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const statusConfig = STATUS_CONFIG[report.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/manager/reports')}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Reports
          </button>

          {/* Title and Status */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{report.title}</h1>
                {report.isLocked && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                    🔒 Locked
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color} flex items-center gap-1.5`}>
                  <StatusIcon className="w-4 h-4" />
                  {statusConfig.label}
                </span>
                <span className="text-sm text-gray-600">
                  {REPORT_TYPES[report.reportType as keyof typeof REPORT_TYPES]}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  report.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                  report.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                  report.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {report.priority} Priority
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              {!report.isLocked && (
                <Link
                  to={`/manager/reports/${id}/edit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
              )}
              {report.status === 'PENDING_REVIEW' && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Review
                </button>
              )}
              {/* Manager CANNOT delete reports - removed delete button */}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white rounded-xl shadow-md p-4 border border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Occurrence Date</p>
                <p className="font-semibold text-gray-900">{formatDate(report.occurrenceDate)}</p>
                <p className="text-xs text-gray-600">{report.occurrenceTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-semibold text-gray-900">{report.locationId.locationName}</p>
                <p className="text-xs text-gray-600">{report.locationId.city}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">BIT</p>
                <p className="font-semibold text-gray-900">{report.bitId.bitName}</p>
                <p className="text-xs text-gray-600">{report.bitId.bitCode}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Supervisor</p>
                <p className="font-semibold text-gray-900">
                  {report.supervisorId?.userId?.firstName 
                    ? `${report.supervisorId.userId.firstName} ${report.supervisorId.userId.lastName}`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rejection/Revision Notes */}
        {report.rejectionReason && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Rejection Reason</h3>
                <p className="text-red-800">{report.rejectionReason}</p>
              </div>
            </div>
          </div>
        )}

        {report.revisionNotes && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-1">Revision Notes</h3>
                <p className="text-orange-800">{report.revisionNotes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Description Section */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Description
          </h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{report.description}</p>
          </div>

          {report.chronologicalNarrative && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Chronological Narrative</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed font-mono text-sm">
                  {report.chronologicalNarrative}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Evidence Section */}
        {((report.images?.length || 0) > 0 || (report.audioRecordings?.length || 0) > 0 || (report.attachedFiles?.length || 0) > 0) && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Evidence & Attachments</h2>

            {/* Images */}
            {report.images && report.images.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  Images ({report.images.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {report.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative group cursor-pointer"
                      onClick={() => setSelectedImage(getImageUrl(image.url))}
                    >
                      <img
                        src={getImageUrl(image.url)}
                        alt={image.filename}
                        className="w-full h-40 object-cover rounded-lg border border-gray-200 hover:border-blue-400 transition-all"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-lg transition-all flex items-center justify-center">
                        <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">{image.filename}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audio Recordings */}
            {report.audioRecordings && report.audioRecordings.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-blue-600" />
                  Audio Recordings ({report.audioRecordings.length})
                </h3>
                <div className="space-y-3">
                  {report.audioRecordings.map((audio, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{audio.filename}</span>
                        {audio.duration && (
                          <span className="text-sm text-gray-600">{audio.duration}s</span>
                        )}
                      </div>
                      <audio controls className="w-full" src={getImageUrl(audio.url)}>
                        Your browser does not support the audio element.
                      </audio>
                      {audio.transcription && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600 font-medium mb-1">Transcription:</p>
                          <p className="text-sm text-gray-700">{audio.transcription}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attached Files */}
            {report.attachedFiles && report.attachedFiles.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-green-600" />
                  Attached Files ({report.attachedFiles.length})
                </h3>
                <div className="space-y-2">
                  {report.attachedFiles.map((file, index) => (
                    <a
                      key={index}
                      href={getImageUrl(file.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Paperclip className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{file.filename}</p>
                          <p className="text-xs text-gray-600">
                            {file.fileType} • {formatFileSize(file.fileSize)}
                          </p>
                        </div>
                      </div>
                      <Download className="w-5 h-5 text-blue-600" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {report.tags && report.tags.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {report.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Audit Trail */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <button
            onClick={() => setShowAuditLog(!showAuditLog)}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <History className="w-6 h-6 text-blue-600" />
              Audit Trail ({report.auditLog.length} actions)
            </h2>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showAuditLog ? 'rotate-180' : ''}`} />
          </button>

          {showAuditLog && (
            <div className="space-y-3">
              {report.auditLog.map((log, index) => (
                <div key={index} className="flex gap-4 pb-3 border-b border-gray-200 last:border-0">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <History className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900">{log.action.replace(/_/g, ' ')}</span>
                      <span className="text-sm text-gray-500">{formatDateTime(log.performedAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      By: {log.performedBy?.firstName || 'System'} {log.performedBy?.lastName || ''}
                    </p>
                    {log.details && (
                      <p className="text-sm text-gray-700 mt-1 italic">{log.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report Metadata Footer */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              Created by: {report.createdBy?.firstName || 'Unknown'} {report.createdBy?.lastName || ''} on {formatDateTime(report.createdAt)}
            </div>
            {report.approvedBy && report.approvedAt && (
              <div>Approved by: {report.approvedBy.firstName} {report.approvedBy.lastName} on {formatDateTime(report.approvedAt)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Review Report</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setReviewAction('approve')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      reviewAction === 'approve'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <CheckCircle className="w-6 h-6 mx-auto mb-1 text-green-600" />
                    <div className="text-sm font-medium">Approve</div>
                  </button>
                  <button
                    onClick={() => setReviewAction('revision')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      reviewAction === 'revision'
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <XCircle className="w-6 h-6 mx-auto mb-1 text-orange-600" />
                    <div className="text-sm font-medium">Request Revision</div>
                  </button>
                  <button
                    onClick={() => setReviewAction('reject')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      reviewAction === 'reject'
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <AlertCircle className="w-6 h-6 mx-auto mb-1 text-red-600" />
                    <div className="text-sm font-medium">Reject</div>
                  </button>
                </div>
              </div>

              {reviewAction !== 'approve' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {reviewAction === 'revision' ? 'Revision Notes *' : 'Rejection Reason *'}
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={
                      reviewAction === 'revision'
                        ? 'Explain what needs to be revised...'
                        : 'Explain why this report is being rejected...'
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewNotes('');
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
