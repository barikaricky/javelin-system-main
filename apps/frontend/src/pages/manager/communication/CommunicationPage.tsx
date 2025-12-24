import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Bell, 
  AlertTriangle, 
  Send,
  CheckCircle,
  Clock,
  Users,
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
  bitId?: {
    name: string;
    code: string;
  };
  acknowledgments: Array<{
    userId: string;
  }>;
  createdAt: string;
}

type TabType = 'messages' | 'broadcasts' | 'alerts';

export default function ManagerCommunicationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('messages');
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [showCreateBroadcast, setShowCreateBroadcast] = useState(false);

  const [alertForm, setAlertForm] = useState({
    title: '',
    content: '',
    alertType: 'THREAT',
    bitId: '',
  });

  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    content: '',
    targetGroup: 'ALL_SUPERVISORS',
  });

  useEffect(() => {
    if (activeTab === 'alerts') {
      loadAlerts();
    }
  }, [activeTab]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/emergency-alerts');
      setAlerts(response.data.alerts || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/emergency-alerts', alertForm);
      alert('Emergency alert sent successfully!');
      setShowCreateAlert(false);
      setAlertForm({ title: '', content: '', alertType: 'THREAT', bitId: '' });
      loadAlerts();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create alert');
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

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await api.post(`/emergency-alerts/${alertId}/acknowledge`);
      loadAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
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
              to="/manager/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-3 sm:mb-4 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="text-sm sm:text-base">Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Communication Center</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Send broadcasts, emergency alerts, and manage messages
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <button
              onClick={() => setShowCreateAlert(true)}
              className="bg-red-50 border-2 border-red-200 rounded-lg p-3 sm:p-4 hover:bg-red-100 transition-all duration-300 text-left transform hover:scale-105 active:scale-95 hover:shadow-lg animate-slideIn"
            >
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 mb-2 animate-pulse" />
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Send Emergency Alert</h3>
              <p className="text-xs sm:text-sm text-gray-600">Immediate action required</p>
            </button>

            <button
              onClick={() => setShowCreateBroadcast(true)}
              className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4 hover:bg-blue-100 transition-all duration-300 text-left transform hover:scale-105 active:scale-95 hover:shadow-lg animate-slideIn"
            >
              <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-2" />
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Create Broadcast</h3>
              <p className="text-xs sm:text-sm text-gray-600">Send to multiple users</p>
            </button>

            <Link
              to="/manager/messaging"
              className="bg-green-50 border-2 border-green-200 rounded-lg p-3 sm:p-4 hover:bg-green-100 transition-all duration-300 text-left transform hover:scale-105 active:scale-95 hover:shadow-lg animate-slideIn"
            >
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-2" />
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Direct Messages</h3>
              <p className="text-xs sm:text-sm text-gray-600">One-on-one communication</p>
            </Link>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200 overflow-x-auto">
              <div className="flex space-x-4 sm:space-x-8 px-3 sm:px-6 min-w-max">
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                    activeTab === 'messages'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                    Messages
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('broadcasts')}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                    activeTab === 'broadcasts'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
                    Broadcasts
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('alerts')}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                    activeTab === 'alerts'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Emergency</span> Alerts
                  </div>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-3 sm:p-6">
              {activeTab === 'messages' && (
                <div className="text-center py-12 animate-fadeIn">
                  <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
                    Access your direct messages and conversations
                  </p>
                  <Link
                    to="/manager/messaging"
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    Open Messaging
                  </Link>
                </div>
              )}

              {activeTab === 'broadcasts' && (
                <div className="text-center py-12 animate-fadeIn">
                  <Bell className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
                    Send announcements to your team
                  </p>
                  <button
                    onClick={() => setShowCreateBroadcast(true)}
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    Create Broadcast
                  </button>
                </div>
              )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No emergency alerts</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {alert.title}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAlertTypeColor(alert.alertType)}`}>
                            {alert.alertType}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3">{alert.content}</p>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>
                            <strong>From:</strong> {alert.triggeredById.firstName} {alert.triggeredById.lastName}
                          </span>
                          {alert.bitId && (
                            <span>
                              <strong>BIT:</strong> {alert.bitId.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => acknowledgeAlert(alert._id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Acknowledge
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Emergency Alert Modal */}
      {showCreateAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Create Emergency Alert</h2>
            <form onSubmit={handleCreateAlert} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Title *
                </label>
                <input
                  type="text"
                  required
                  value={alertForm.title}
                  onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Brief title for the alert"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Type *
                </label>
                <select
                  value={alertForm.alertType}
                  onChange={(e) => setAlertForm({ ...alertForm, alertType: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="THREAT">Threat</option>
                  <option value="INJURY">Injury</option>
                  <option value="BREACH">Security Breach</option>
                  <option value="FIRE">Fire</option>
                  <option value="CLIENT_ISSUE">Client Issue</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Details *
                </label>
                <textarea
                  required
                  value={alertForm.content}
                  onChange={(e) => setAlertForm({ ...alertForm, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Describe the emergency situation..."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAlert(false)}
                  className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 sm:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm sm:text-base order-1 sm:order-2"
                >
                  Send Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Broadcast Modal */}
      {showCreateBroadcast && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Broadcast</h2>
            <form onSubmit={handleCreateBroadcast} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Group *
                </label>
                <select
                  value={broadcastForm.targetGroup}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, targetGroup: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL_GS">All General Supervisors</option>
                  <option value="ALL_SUPERVISORS">All Supervisors</option>
                  <option value="BIT_SUPERVISORS">BIT Supervisors</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  required
                  value={broadcastForm.content}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateBroadcast(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
