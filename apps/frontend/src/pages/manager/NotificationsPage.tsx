import { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
  Key,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationService, Notification, CredentialViewResult } from '../../services/notificationService';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [credentialModal, setCredentialModal] = useState<{
    notification: Notification;
    result: CredentialViewResult | null;
    loading: boolean;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'approvals'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getAll();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleViewCredentials = async (notification: Notification) => {
    setCredentialModal({ notification, result: null, loading: true });
    
    try {
      const result = await notificationService.viewCredentials(notification.id);
      setCredentialModal({ notification, result, loading: false });
      
      // Update the notification in the list with new view count
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id
            ? { ...n, viewCount: result.viewCount, isRead: true }
            : n
        )
      );
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to view credentials');
      setCredentialModal(null);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUPERVISOR_APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'SUPERVISOR_REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'SUPERVISOR_APPROVAL':
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'SUPERVISOR_APPROVED':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' };
      case 'SUPERVISOR_REJECTED':
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' };
      case 'SUPERVISOR_APPROVAL':
        return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Info' };
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'approvals') return ['SUPERVISOR_APPROVED', 'SUPERVISOR_REJECTED'].includes(n.type);
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-600 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'approvals', label: 'Approvals' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === tab.key
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No notifications</p>
            <p className="text-gray-500 text-sm mt-1">
              {filter === 'unread' ? 'All notifications have been read' : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => {
              const badge = getNotificationBadge(notification.type);
              const hasCredentials = notification.type === 'SUPERVISOR_APPROVED';
              const viewsRemaining = hasCredentials 
                ? (notification.maxViews || 3) - (notification.viewCount || 0) 
                : 0;
              const canViewCredentials = hasCredentials && viewsRemaining > 0;

              return (
                <div
                  key={notification.id}
                  className={`p-4 transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-emerald-50/50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (!notification.isRead) handleMarkAsRead(notification.id);
                  }}
                >
                  <div className="flex gap-3 sm:gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <div className="p-2 bg-gray-100 rounded-full">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {notification.subject && (
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                            {notification.subject}
                          </h3>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                        )}
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {notification.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>
                          {new Date(notification.createdAt).toLocaleDateString('en-NG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        {/* Credentials View Button for Approved Supervisors */}
                        {hasCredentials && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (canViewCredentials) {
                                  handleViewCredentials(notification);
                                }
                              }}
                              disabled={!canViewCredentials}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                canViewCredentials
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 active:bg-emerald-300'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {canViewCredentials ? (
                                <>
                                  <Key className="w-3.5 h-3.5" />
                                  View Credentials
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  View Limit Reached
                                </>
                              )}
                            </button>
                            <span className={`text-xs ${viewsRemaining > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                              {viewsRemaining > 0 
                                ? `${viewsRemaining} view${viewsRemaining > 1 ? 's' : ''} left` 
                                : 'No views left'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 hidden sm:block" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Credential View Modal */}
      {credentialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            {/* Handle bar for mobile */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden" />

            {credentialModal.loading ? (
              <div className="py-8 text-center">
                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading credentials...</p>
              </div>
            ) : credentialModal.result?.canView && credentialModal.result.credentials ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Key className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Supervisor Credentials</h3>
                    <p className="text-xs text-gray-500">
                      {credentialModal.result.remainingViews} view{credentialModal.result.remainingViews !== 1 ? 's' : ''} remaining
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-3 mb-4">
                  {/* Employee ID */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-gray-500 block">Employee ID</span>
                      <code className="font-mono text-sm text-gray-900">
                        {credentialModal.result.credentials.employeeId}
                      </code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(credentialModal.result!.credentials!.employeeId, 'employeeId')}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg"
                    >
                      {copiedField === 'employeeId' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-gray-500 block">Email</span>
                      <code className="text-sm text-gray-900 break-all">
                        {credentialModal.result.credentials.email}
                      </code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(credentialModal.result!.credentials!.email, 'email')}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg flex-shrink-0"
                    >
                      {copiedField === 'email' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Password */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-gray-500 block">Temporary Password</span>
                      <code className="font-mono text-sm text-gray-900">
                        {credentialModal.result.credentials.temporaryPassword}
                      </code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(credentialModal.result!.credentials!.temporaryPassword, 'password')}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg"
                    >
                      {copiedField === 'password' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Warning */}
                <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Important</p>
                    <p>Share these credentials securely. The supervisor must change their password on first login. You have {credentialModal.result.remainingViews} view{credentialModal.result.remainingViews !== 1 ? 's' : ''} remaining.</p>
                  </div>
                </div>

                <button
                  onClick={() => setCredentialModal(null)}
                  className="w-full px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 text-sm font-medium"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-full">
                    <EyeOff className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">View Limit Reached</h3>
                </div>

                <p className="text-gray-600 mb-4">
                  {credentialModal.result?.message || 'You have reached the maximum number of views for these credentials. They are no longer accessible for security reasons.'}
                </p>

                <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>If you need access to these credentials again, please contact the Director to re-approve the supervisor registration.</p>
                </div>

                <button
                  onClick={() => setCredentialModal(null)}
                  className="w-full px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 text-sm font-medium"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
