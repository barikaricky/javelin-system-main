import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  UserPlus,
  Calendar,
  FileText,
  Clock,
  X,
  Check,
  Eye,
  Trash2,
  AlertTriangle,
  MessageSquare,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'approval' | 'incident' | 'meeting' | 'message' | 'alert' | 'info';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  metadata?: any;
}

export default function NotificationCard() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Refresh every 15s (was 30s)
    
    // Fetch notifications when user returns to the page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchNotifications();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/director/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/director/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/director/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/director/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'approval':
        return <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'incident':
        return <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'meeting':
        return <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'alert':
        return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
      default:
        return <Info className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'approval':
        return 'from-blue-500 to-blue-600';
      case 'incident':
        return 'from-red-500 to-red-600';
      case 'meeting':
        return 'from-purple-500 to-purple-600';
      case 'message':
        return 'from-green-500 to-green-600';
      case 'alert':
        return 'from-orange-500 to-orange-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getPriorityBorder = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-500';
      case 'high':
        return 'border-l-4 border-orange-500';
      case 'medium':
        return 'border-l-4 border-yellow-500';
      default:
        return 'border-l-4 border-gray-300';
    }
  };

  const filteredNotifications = notifications.filter(n => 
    filter === 'all' ? true : !n.read
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-4 sm:px-5 py-4 sm:py-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Notifications</h2>
              <p className="text-blue-100 text-xs sm:text-sm">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white text-xs sm:text-sm font-medium transition-all"
            >
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Mark All</span>
              <span className="sm:hidden">All</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-white text-blue-600 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              filter === 'unread'
                ? 'bg-white text-blue-600 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium text-sm sm:text-base">No notifications</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              {filter === 'unread' ? 'All notifications have been read' : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`group relative p-3 sm:p-4 hover:bg-gray-50 transition-all cursor-pointer ${
                  !notification.read ? 'bg-blue-50/50' : ''
                } ${getPriorityBorder(notification.priority)}`}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Unread Indicator */}
                {!notification.read && (
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}

                <div className="flex gap-2 sm:gap-3">
                  {/* Icon */}
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${getTypeColor(notification.type)} rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm`}>
                    {getIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`font-semibold text-sm sm:text-base ${
                        !notification.read ? 'text-slate-900' : 'text-slate-700'
                      }`}>
                        {notification.title}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}</span>
                      {notification.priority === 'urgent' && (
                        <>
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <span className="text-red-600 font-medium">URGENT</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons (visible on hover) */}
                <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-sm transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="w-6 h-6 sm:w-7 sm:h-7 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center shadow-sm transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="bg-gray-50 px-4 sm:px-5 py-3 border-t border-gray-100">
          <button
            onClick={() => navigate('/director/notifications')}
            className="w-full py-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
}
