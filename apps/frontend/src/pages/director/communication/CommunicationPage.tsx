import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Bell, 
  AlertTriangle, 
  Users, 
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import api from '../../../lib/api';

// Add animations via inline styles
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-in-out;
  }
  
  .animate-slideIn {
    animation: slideIn 0.3s ease-out;
  }
`;

interface EmergencyAlert {
  _id: string;
  title: string;
  content: string;
  alertType: string;
  status: string;
  triggeredById: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  approvedById?: {
    firstName: string;
    lastName: string;
  };
  bitId?: {
    name: string;
    code: string;
  };
  locationId?: {
    name: string;
  };
  acknowledgments: Array<{
    userId: string;
    acknowledgedAt: string;
  }>;
  createdAt: string;
  sentAt?: string;
}

interface Message {
  _id: string;
  senderId: {
    firstName: string;
    lastName: string;
    role: string;
  };
  content: string;
  conversationId: string;
  createdAt: string;
  status: string;
}

interface Broadcast {
  _id: string;
  title: string;
  content: string;
  senderId: {
    firstName: string;
    lastName: string;
    role: string;
  };
  targetRoles: string[];
  targetGroup?: string;
  sentCount: number;
  readCount: number;
  createdAt: string;
}

type TabType = 'messages' | 'broadcasts' | 'alerts' | 'logs';

export default function DirectorCommunicationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('alerts');
  const [messages, setMessages] = useState<Message[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'alerts') {
        await loadAlerts();
      } else if (activeTab === 'broadcasts') {
        await loadBroadcasts();
      } else if (activeTab === 'messages') {
        await loadMessages();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await api.get('/emergency-alerts', { params });
      setAlerts(response.data.alerts || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadBroadcasts = async () => {
    try {
      const response = await api.get('/messaging/broadcasts');
      setBroadcasts(response.data.broadcasts || []);
    } catch (error) {
      console.error('Error loading broadcasts:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await api.get('/messaging/conversations');
      // Extract all messages from conversations
      const allMessages: Message[] = [];
      if (response.data.conversations) {
        response.data.conversations.forEach((conv: any) => {
          if (conv.lastMessage) {
            allMessages.push(conv.lastMessage);
          }
        });
      }
      setMessages(allMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const exportCommunicationLogs = async () => {
    try {
      const response = await api.get('/communications/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `communication_logs_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting logs:', error);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const filteredAlerts = alerts.filter(alert =>
    alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-4 sm:mb-6 animate-fadeIn">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Communication Module</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Monitor and audit all communication across the system
            </p>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Alerts</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{alerts.length}</p>
              </div>
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 animate-pulse" />
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-lg shadow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Broadcasts</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{broadcasts.length}</p>
              </div>
              <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-lg shadow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Messages</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{messages.length}</p>
              </div>
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-lg shadow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Active Users</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">-</p>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
            </div>
          </div>
        </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-4 sm:mb-6 overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex space-x-4 sm:space-x-8 px-3 sm:px-6 min-w-max">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === 'alerts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Emergency</span> Alerts
              </div>
            </button>

            <button
              onClick={() => setActiveTab('broadcasts')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === 'broadcasts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
                Broadcasts
              </div>
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === 'messages'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                Messages
              </div>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Audit</span> Logs
              </div>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-3 sm:p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {activeTab === 'alerts' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="SENT">Sent</option>
              <option value="REJECTED">Rejected</option>
            </select>
          )}

          <button
            onClick={exportCommunicationLogs}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm sm:text-base rounded-lg hover:bg-gray-900 transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm sm:text-base text-gray-600">Loading...</p>
            </div>
          ) : (
            <>
              {/* Emergency Alerts Tab */}
              {activeTab === 'alerts' && (
                <div className="space-y-3 sm:space-y-4">
                  {filteredAlerts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 animate-fadeIn">
                      <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm sm:text-base">No emergency alerts found</p>
                    </div>
                  ) : (
                    filteredAlerts.map((alert) => (
                      <div
                        key={alert._id}
                        className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slideIn"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                              {getStatusIcon(alert.status)}
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex-1">
                                {alert.title}
                              </h3>
                              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getAlertTypeColor(alert.alertType)}`}>
                                {alert.alertType}
                              </span>
                            </div>
                            <p className="text-sm sm:text-base text-gray-700 mb-3">{alert.content}</p>
                            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                                <strong>By:</strong> {alert.triggeredById.firstName} {alert.triggeredById.lastName} ({alert.triggeredById.role})
                              </span>
                              {alert.bitId && (
                                <span className="flex items-center gap-1">
                                  <strong>BIT:</strong> {alert.bitId.name} ({alert.bitId.code})
                                </span>
                              )}
                              {alert.approvedById && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                                  <strong>Approved by:</strong> {alert.approvedById.firstName} {alert.approvedById.lastName}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                <strong>Acks:</strong> {alert.acknowledgments.length}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Broadcasts Tab */}
              {activeTab === 'broadcasts' && (
                <div className="space-y-3 sm:space-y-4">
                  {broadcasts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 animate-fadeIn">
                      <Bell className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm sm:text-base">No broadcasts found</p>
                    </div>
                  ) : (
                    broadcasts.map((broadcast) => (
                      <div
                        key={broadcast._id}
                        className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slideIn"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                          <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-blue-500" />
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                              {broadcast.title}
                            </h3>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                            {new Date(broadcast.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base text-gray-700 mb-3">{broadcast.content}</p>
                        <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                            <strong>From:</strong> {broadcast.senderId.firstName} {broadcast.senderId.lastName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                            <strong>Sent:</strong> {broadcast.sentCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                            <strong>Read:</strong> {broadcast.readCount}
                          </span>
                          {broadcast.targetGroup && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              <strong>Target:</strong> {broadcast.targetGroup}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <div className="space-y-3 sm:space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 animate-fadeIn">
                      <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm sm:text-base">No messages found</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message._id}
                        className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slideIn"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-green-500" />
                            <span className="font-medium text-sm sm:text-base text-gray-900">
                              {message.senderId.firstName} {message.senderId.lastName} ({message.senderId.role})
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                            {new Date(message.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base text-gray-700">{message.content}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Audit Logs Tab */}
              {activeTab === 'logs' && (
                <div className="text-center py-12 animate-fadeIn">
                  <Filter className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 text-gray-400 animate-pulse" />
                  <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
                    Complete audit trail of all communication activities
                  </p>
                  <button
                    onClick={exportCommunicationLogs}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    Export Full Audit Log
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
        </div>
      </div>
    </>
  );
}
