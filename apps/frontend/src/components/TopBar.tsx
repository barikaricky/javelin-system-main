import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/authStore';
import { api, getImageUrl } from '../lib/api';

interface TopBarProps {
  onMenuClick: () => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // All roles use the same /notifications endpoint
        if (!user?.role) return;
        
        const response = await api.get('/notifications');
        const notifs = response.data.notifications || response.data || [];
        setNotifications(notifs.slice(0, 5)); // Show last 5
        setUnreadCount(notifs.filter((n: Notification) => !n.read).length);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [user?.role]);

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    navigate('/login');
  };

  const markAsRead = async (notificationId: string) => {
    try {
      let endpoint = '/notifications';
      if (user?.role === 'DIRECTOR') {
        endpoint = '/director/notifications';
      } else if (user?.role === 'MANAGER') {
        endpoint = '/manager/notifications';
      } else if (user?.role === 'SUPERVISOR') {
        endpoint = '/supervisor/notifications';
      }
      // SECRETARY and other roles use the default /notifications endpoint
      
      await api.patch(`${endpoint}/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval': return '👤';
      case 'incident': return '🚨';
      case 'meeting': return '📅';
      case 'message': return '💬';
      case 'alert': return '⚠️';
      default: return '📢';
    }
  };

  return (
    <header className="top-bar justify-between h-14 sm:h-16">
      {/* Left: Hamburger Menu */}
      <button
        onClick={onMenuClick}
        className="touch-target hover:bg-blue-600 rounded-md lg:hidden p-1.5 sm:p-2"
      >
        <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <h1 className="text-lg sm:text-xl font-bold hidden lg:block">Dashboard</h1>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="touch-target hover:bg-blue-600 rounded-md relative p-1.5 sm:p-2"
          >
            <BellIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-error text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-3 sm:px-4 py-2.5 sm:py-3 text-white">
                  <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                    <BellIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="bg-white/20 px-1.5 sm:px-2 py-0.5 rounded-full text-xs">
                        {unreadCount} unread
                      </span>
                    )}
                  </h3>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 sm:p-8 text-center text-gray-500">
                      <BellIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-xs sm:text-sm">No notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map(notification => (
                        <div
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={`p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex gap-2 sm:gap-3">
                            <span className="text-xl sm:text-2xl flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">
                                {notification.title}
                              </p>
                              <p className="text-[10px] sm:text-xs text-gray-600 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-200 p-2">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/director/notifications');
                    }}
                    className="w-full py-2 text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="touch-target hover:bg-blue-600 rounded-full flex items-center gap-1 sm:gap-2 p-1"
          >
            {user?.profilePhoto || user?.profilePicture ? (
              <img
                src={
                  user?.profilePhoto?.startsWith('data:') || user?.profilePicture?.startsWith('data:')
                    ? (user?.profilePhoto || user?.profilePicture)
                    : getImageUrl(user?.profilePhoto || user?.profilePicture)
                }
                alt={`${user.firstName} ${user.lastName}`}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full object-cover border-2 border-white"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.nextElementSibling) {
                    (target.nextElementSibling as HTMLElement).style.display = 'flex';
                  }
                }}
              />
            ) : null}
            {(!user?.profilePhoto && !user?.profilePicture) || true ? (
              <div 
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-blue-800 flex items-center justify-center text-white text-xs sm:text-sm font-semibold border-2 border-white"
                style={{ display: (user?.profilePhoto || user?.profilePicture) ? 'none' : 'flex' }}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            ) : null}
          </button>

          {/* Profile Dropdown */}
          {showProfile && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowProfile(false)}
              />
              <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-3 sm:p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3">
                    {user?.profilePhoto ? (
                      <img
                        src={getImageUrl(user.profilePhoto)}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{user?.email}</p>
                      <p className="text-[10px] sm:text-xs text-blue-600 font-medium mt-1">{user?.role}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button 
                    onClick={() => {
                      setShowProfile(false);
                      const profileRoute = user?.role === 'DIRECTOR' ? '/director/profile' 
                        : user?.role === 'MANAGER' ? '/manager/profile'
                        : user?.role === 'SECRETARY' ? '/secretary/settings'
                        : user?.role === 'SUPERVISOR' ? '/supervisor/profile'
                        : '/profile';
                      navigate(profileRoute);
                    }}
                    className="w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-100 rounded-md transition-colors text-xs sm:text-sm"
                  >
                    Profile Settings
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-100 rounded-md text-red-600 transition-colors text-xs sm:text-sm"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
