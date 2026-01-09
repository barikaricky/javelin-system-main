import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../stores/notificationStore';
import { Bell, Check, X, AlertTriangle, Info, CheckCircle, XCircle, Video, FileText, Clock, UserCheck } from 'lucide-react';

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll, 
    fetchNotifications,
    isLoading 
  } = useNotificationStore();
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 15 seconds (was 30s)
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    // Fetch notifications when user returns to the page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getIcon = (type: string, relatedEntityType?: string) => {
    // Custom icons based on entity type
    if (relatedEntityType === 'MEETING') {
      return (
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
          <Video className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
        </div>
      );
    }
    if (relatedEntityType === 'DOCUMENT') {
      return (
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
        </div>
      );
    }
    if (relatedEntityType === 'SUPERVISOR_APPROVAL') {
      return (
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
        </div>
      );
    }

    // Default icons based on type
    switch (type) {
      case 'success':
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          </div>
        );
      case 'error':
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
        );
    }
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    // Navigate to action URL if provided
    if (notification.actionUrl) {
      setIsOpen(false);
      navigate(notification.actionUrl);
    }
  };

  const formatTime = (date: Date) => {
    try {
      const now = new Date();
      const notificationDate = new Date(date);
      
      // Check if date is valid
      if (isNaN(notificationDate.getTime())) {
        return 'Recently';
      }
      
      const diff = now.getTime() - notificationDate.getTime();
      
      // Handle negative diff (future dates)
      if (diff < 0) {
        return 'Just now';
      }
      
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return 'Just now';
    } catch (error) {
      return 'Recently';
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 sm:p-2.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-95"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px] text-[10px] sm:text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="fixed inset-x-0 top-14 sm:inset-auto sm:absolute sm:right-0 sm:top-auto sm:mt-2 mx-2 sm:mx-0 sm:w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] sm:max-h-[70vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-white" />
              <h3 className="text-base sm:text-lg font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-white/20 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-white/80 hover:text-white hover:bg-white/10 transition-colors px-2 py-1 rounded-md whitespace-nowrap"
                  >
                    <Check className="w-4 h-4 inline mr-1" />
                    <span className="hidden sm:inline">Mark all read</span>
                  </button>
                  <button
                    onClick={clearAll}
                    className="text-xs text-white/80 hover:text-white hover:bg-white/10 transition-colors px-2 py-1 rounded-md whitespace-nowrap"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1 overscroll-contain bg-gray-50">
            {isLoading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-700 text-sm font-medium">No notifications yet</p>
                <p className="text-gray-500 text-xs mt-1 text-center">We'll notify you when something happens</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-white active:bg-gray-100 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'bg-white'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {getIcon(notification.type, notification.relatedEntityType)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold break-words ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors p-1 -mt-1 -mr-1 rounded hover:bg-gray-100"
                            aria-label="Remove notification"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 break-words leading-relaxed">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-xs text-gray-500 font-medium">{formatTime(notification.timestamp)}</p>
                          {notification.actionUrl && (
                            <span className="text-xs text-blue-600 font-medium">Click to view →</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
