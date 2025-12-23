import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  AlertTriangle, 
  AlertOctagon, 
  Trash2, 
  CheckCircle, 
  X,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  Eye,
  Archive
} from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface Notification {
  _id: string;
  id: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  category: string;
  message: string;
  urgent: boolean;
  read: boolean;
  createdAt: string;
  metadata?: any;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterUrgent, setFilterUrgent] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API endpoint when available
      const response = await api.get('/director/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      // Mock data for development
      const mockNotifications: Notification[] = [
        {
          _id: '1',
          id: '1',
          type: 'critical',
          category: 'Security',
          message: 'Location ABC requires immediate attention - 3 operators absent',
          urgent: true,
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          _id: '2',
          id: '2',
          type: 'warning',
          category: 'Attendance',
          message: '5 staff members marked late today',
          urgent: true,
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          _id: '3',
          id: '3',
          type: 'info',
          category: 'Financial',
          message: 'New expense request awaiting approval - ₦500,000',
          urgent: false,
          read: true,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ];
      setNotifications(mockNotifications);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setNotificationToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!notificationToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/director/notifications/${notificationToDelete}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationToDelete));
      toast.success('Notification deleted successfully');
      setShowDeleteModal(false);
      setNotificationToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    } finally {
      setDeleting(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/director/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      toast.success('Marked as read');
    } catch (error: any) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/director/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error: any) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesUrgent = filterUrgent === 'all' || 
                         (filterUrgent === 'urgent' && notification.urgent) ||
                         (filterUrgent === 'normal' && !notification.urgent);
    return matchesSearch && matchesType && matchesUrgent;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertOctagon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />;
      case 'success': return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />;
      default: return <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />;
    }
  };

  const getTypeStyles = (type: string, urgent: boolean) => {
    if (urgent) {
      return 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200 hover:shadow-lg';
    }
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getTimeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => n.urgent).length;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  {unreadCount} unread • {urgentCount} urgent
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchNotifications()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
              <button
                onClick={handleMarkAllAsRead}
                className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                Mark All Read
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
            </select>

            <select
              value={filterUrgent}
              onChange={(e) => setFilterUrgent(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent Only</option>
              <option value="normal">Normal Only</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <Bell className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No notifications found</h3>
            <p className="text-sm sm:text-base text-gray-600">
              {searchQuery || filterType !== 'all' || filterUrgent !== 'all'
                ? 'Try adjusting your filters'
                : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white rounded-xl shadow-sm border p-3 sm:p-4 transition-all hover:shadow-md ${getTypeStyles(notification.type, notification.urgent)} ${
                  !notification.read ? 'border-l-4' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 sm:p-2.5 rounded-lg flex-shrink-0 ${
                    notification.urgent ? 'bg-red-100' :
                    notification.type === 'critical' ? 'bg-red-100' :
                    notification.type === 'warning' ? 'bg-yellow-100' :
                    notification.type === 'success' ? 'bg-green-100' :
                    'bg-blue-100'
                  }`}>
                    {getTypeIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          notification.urgent ? 'bg-red-200 text-red-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {notification.category}
                        </span>
                        {notification.urgent && (
                          <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-medium animate-pulse">
                            URGENT
                          </span>
                        )}
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {getTimeSince(notification.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm sm:text-base text-gray-900 mb-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification._id)}
                        className="text-xs sm:text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Footer */}
        {filteredNotifications.length > 0 && (
          <div className="mt-4 sm:mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Showing {filteredNotifications.length} of {notifications.length} notifications</span>
              <button
                onClick={handleMarkAllAsRead}
                className="sm:hidden text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark All Read
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4 mb-4">
              <div className="p-2 sm:p-3 bg-red-100 rounded-full flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Delete Notification</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Are you sure you want to delete this notification? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setNotificationToDelete(null);
                }}
                className="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-3 sm:px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
