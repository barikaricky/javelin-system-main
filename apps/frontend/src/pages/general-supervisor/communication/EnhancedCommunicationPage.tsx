import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Bell, 
  AlertTriangle, 
  Send,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';
import api from '../../../lib/api';

const styles = `
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fadeIn { animation: fadeIn 0.5s ease-in-out; }
  .animate-slideIn { animation: slideIn 0.3s ease-out; }
`;

interface EmergencyAlert {
  _id: string;
  title: string;
  content: string;
  alertType: string;
  status: string;
  triggeredById: {
    firstName: string;
    lastName: string;
    role: string;
  };
  beatId?: {
    name: string;
    code: string;
  };
  acknowledgments: Array<{
    userId: string;
  }>;
  createdAt: string;
}

type TabType = 'messages' | 'broadcasts' | 'pending-alerts' | 'sent-alerts';

export default function GSEnhancedCommunicationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pending-alerts');
  const [pendingAlerts, setPendingAlerts] = useState<EmergencyAlert[]>([]);
  const [sentAlerts, setSentAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateBroadcast, setShowCreateBroadcast] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    content: '',
    targetGroup: 'ALL_SUPERVISORS',
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const [pendingRes, sentRes] = await Promise.all([
        api.get('/emergency-alerts', { params: { status: 'PENDING' } }),
        api.get('/emergency-alerts', { params: { status: 'SENT' } }),
      ]);
      
      setPendingAlerts(pendingRes.data.alerts || []);
      setSentAlerts(sentRes.data.alerts || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAlert = async (alertId: string) => {
    try {
      await api.post(`/emergency-alerts/${alertId}/approve`);
      alert('Emergency alert approved and sent!');
      loadAlerts();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to approve alert');
    }
  };

  const handleRejectAlert = async () => {
    if (!selectedAlert || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      await api.post(`/emergency-alerts/${selectedAlert}/reject`, {
        reason: rejectionReason,
      });
      alert('Emergency alert rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedAlert(null);
      loadAlerts();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to reject alert');
    }
  };

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/messaging/broadcasts', broadcastForm);
      alert('Broadcast sent successfully!');
      setShowCreateBroadcast(false);
      setBroadcastForm({ title: '', content: '', targetGroup: 'ALL_SUPERVISORS' });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create broadcast');
    }
  };

  const getAlertTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      THREAT: 'bg-red-100 text-red-800',
      INJURY: 'bg-orange-100 text-orange-800',
      BREACH: 'bg-purple-100 text-purple-800',
      FIRE: 'bg-red-200 text-red-900',
      CLIENT_ISSUE: 'bg-yellow-100 text-yellow-800',
      OTHER: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.OTHER;
  };

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-4 sm:mb-6 animate-fadeIn">
            <Link
              to="/general-supervisor/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-3 sm:mb-4 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="text-sm sm:text-base">Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Communication Center</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Approve emergency alerts and send broadcasts to your team
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slideIn">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Pending Approvals</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{pendingAlerts.length}</p>
                </div>
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 animate-pulse" />
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slideIn">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Sent Alerts</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{sentAlerts.length}</p>
                </div>
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
              </div>
            </div>

            <button
              onClick={() => setShowCreateBroadcast(true)}
              className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4 hover:bg-blue-100 transition-all duration-300 text-left transform hover:scale-105 active:scale-95 hover:shadow-lg animate-slideIn"
            >
              <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-2" />
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Create Broadcast</h3>
              <p className="text-xs sm:text-sm text-gray-600">Send to supervisors</p>
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6 animate-fadeIn overflow-hidden">
            <div className="border-b overflow-x-auto">
              <div className="flex min-w-max">
                <button
                  onClick={() => setActiveTab('pending-alerts')}
                  className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    activeTab === 'pending-alerts'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    Pending Approvals
                    {pendingAlerts.length > 0 && (
                      <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
                        {pendingAlerts.length}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('sent-alerts')}
                  className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    activeTab === 'sent-alerts'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                    Sent Alerts
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('broadcasts')}
                  className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    activeTab === 'broadcasts'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
                    Broadcasts
                  </div>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-3 sm:p-4 md:p-6">
              {loading ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4">Loading...</p>
                </div>
              ) : (
                <>
                  {/* Pending Alerts */}
                  {activeTab === 'pending-alerts' && (
                    <div className="space-y-3 sm:space-y-4">
                      {pendingAlerts.length === 0 ? (
                        <div className="text-center py-8 sm:py-12 text-gray-500 animate-fadeIn">
                          <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-xs sm:text-sm">No pending alert approvals</p>
                        </div>
                      ) : (
                        pendingAlerts.map((alert) => (
                          <div
                            key={alert._id}
                            className="border-2 border-yellow-300 bg-yellow-50 rounded-lg p-3 sm:p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slideIn"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
                                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                                    {alert.title}
                                  </h3>
                                  <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getAlertTypeColor(alert.alertType)}`}>
                                    {alert.alertType}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 break-words">{alert.content}</p>
                                <div className="flex flex-col sm:flex-row sm:gap-4 gap-1 text-xs sm:text-sm text-gray-600">
                                  <span className="break-words">
                                    <strong>Submitted by:</strong> {alert.triggeredById.firstName} {alert.triggeredById.lastName} ({alert.triggeredById.role})
                                  </span>
                                  {alert.beatId && (
                                    <span className="break-words">
                                      <strong>BEAT:</strong> {alert.beatId.name}
                                    </span>
                                  )}
                                  <span className="break-words">
                                    <strong>Time:</strong> {new Date(alert.createdAt).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                              <button
                                onClick={() => {
                                  setSelectedAlert(alert._id);
                                  setShowRejectModal(true);
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-all duration-200 transform hover:scale-105 active:scale-95 text-xs sm:text-sm font-medium order-2 sm:order-1"
                              >
                                <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                Reject
                              </button>
                              <button
                                onClick={() => handleApproveAlert(alert._id)}
                                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105 active:scale-95 text-xs sm:text-sm font-medium order-1 sm:order-2"
                              >
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                Approve & Send
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Sent Alerts */}
                  {activeTab === 'sent-alerts' && (
                    <div className="space-y-3 sm:space-y-4">
                      {sentAlerts.length === 0 ? (
                        <div className="text-center py-8 sm:py-12 text-gray-500 animate-fadeIn">
                          <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-xs sm:text-sm">No sent alerts</p>
                        </div>
                      ) : (
                        sentAlerts.map((alert) => (
                          <div
                            key={alert._id}
                            className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slideIn"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                                    {alert.title}
                                  </h3>
                                  <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getAlertTypeColor(alert.alertType)}`}>
                                    {alert.alertType}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 break-words">{alert.content}</p>
                                <div className="flex flex-col sm:flex-row sm:gap-4 gap-1 text-xs sm:text-sm text-gray-600">
                                  <span className="break-words">
                                    <strong>From:</strong> {alert.triggeredById.firstName} {alert.triggeredById.lastName}
                                  </span>
                                  <span>
                                    <strong>Acknowledged:</strong> {alert.acknowledgments.length}
                                  </span>
                                </div>
                              </div>
                            </div>
                      </div>
                    ))
                  )}
                </div>
              )}

                  {/* Broadcasts */}
                  {activeTab === 'broadcasts' && (
                    <div className="text-center py-8 sm:py-12 animate-fadeIn">
                      <Bell className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                        Send announcements to your team
                      </p>
                      <button
                        onClick={() => setShowCreateBroadcast(true)}
                        className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95 text-xs sm:text-sm font-medium"
                      >
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                        Create Broadcast
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto animate-slideIn">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Reject Emergency Alert</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              Please provide a reason for rejecting this alert. The supervisor will be notified.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-3 sm:mb-4 text-xs sm:text-sm"
              placeholder="Enter rejection reason..."
            />
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedAlert(null);
                }}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 text-xs sm:text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectAlert}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 transform hover:scale-105 active:scale-95 text-xs sm:text-sm font-medium"
              >
                Reject Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Broadcast Modal */}
      {showCreateBroadcast && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-lg max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto animate-slideIn">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Create Broadcast</h2>
            <form onSubmit={handleCreateBroadcast} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Target Group *
                </label>
                <select
                  value={broadcastForm.targetGroup}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, targetGroup: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                >
                  <option value="ALL_SUPERVISORS">All Supervisors</option>
                  <option value="BIT_SUPERVISORS">BEAT Supervisors</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  required
                  value={broadcastForm.content}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateBroadcast(false)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 text-xs sm:text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95 text-xs sm:text-sm font-medium"
                >
                  Send Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </div>
    </>
  );
}
