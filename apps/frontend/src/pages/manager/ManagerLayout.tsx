import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  MapPin,
  ClipboardCheck,
  AlertTriangle,
  Activity,
  DollarSign,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Shield,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { api, getImageUrl } from '../../lib/api';
import { notificationService, Notification } from '../../services/notificationService';
import { useAuthStore } from '../../stores/authStore';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePhoto?: string;
  passportPhoto?: string;
}

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/manager/dashboard',
  },
  {
    id: 'supervisors',
    label: 'Supervisors',
    icon: UserCheck,
    path: '/manager/supervisors',
    badge: 'View',
  },
  {
    id: 'register-gs',
    label: 'Register General Supervisor',
    icon: Shield,
    path: '/manager/supervisors/register',
    badge: 'New',
  },
  {
    id: 'register-secretary',
    label: 'Register Secretary',
    icon: Building2,
    path: '/manager/secretary/register',
    badge: 'New',
  },
  {
    id: 'pending-approvals',
    label: 'Pending Approvals',
    icon: Clock,
    path: '/manager/pending-approvals',
    badge: 'Review',
  },
  {
    id: 'operator-approvals',
    label: 'Operator Approvals',
    icon: UserCheck,
    path: '/manager/operator-approvals',
    badge: 'Approve',
  },
  {
    id: 'operators',
    label: 'Operators',
    icon: Users,
    path: '/manager/operators',
    badge: 'View',
  },
  {
    id: 'assignments',
    label: 'Guard Assignments',
    icon: Shield,
    path: '/manager/assignments',
    badge: 'New',
  },
  {
    id: 'locations',
    label: 'Locations',
    icon: MapPin,
    path: '/manager/locations',
    badge: 'View',
  },
  {
    id: 'bits',
    label: 'Bits',
    icon: Shield,
    path: '/manager/bits',
    badge: 'View',
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: ClipboardCheck,
    path: '/manager/attendance',
    badge: 'View',
  },
  {
    id: 'incidents',
    label: 'Incidents',
    icon: AlertTriangle,
    path: '/manager/incidents',
    badge: 'Escalate',
  },
  {
    id: 'activity-logs',
    label: 'Activity Logs',
    icon: Activity,
    path: '/manager/activity-logs',
    badge: 'View',
  },
  {
    id: 'salary',
    label: 'Salary Panel',
    icon: DollarSign,
    path: '/manager/salary',
    badge: 'View',
  },
  {
    id: 'money-in',
    label: 'Money In (View Only)',
    icon: TrendingUp,
    path: '/manager/money-in',
    badge: 'View',
  },
  {
    id: 'requests',
    label: 'Requests',
    icon: FileText,
    path: '/manager/requests',
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: MessageSquare,
    path: '/manager/messages',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    path: '/manager/analytics',
    badge: 'View',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/manager/settings',
  },
];

export default function ManagerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Get user from auth store
  const { user: authUser, isAuthenticated, clearAuth } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (isAuthenticated() && authUser) {
      // Set user from auth store
      setUser({
        id: authUser.id,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        email: authUser.email,
        role: authUser.role,
        profilePhoto: authUser.profilePhoto,
      });
      
      // Redirect if not a manager
      if (authUser.role !== 'MANAGER') {
        navigate('/login');
        return;
      }
      
      // Fetch fresh user profile from API to get profile photo
      fetchUserProfile();
      // Fetch notifications
      fetchNotifications();
    } else {
      navigate('/login');
    }
  }, [navigate, authUser, isAuthenticated]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        notificationService.getAll(),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(notifs.slice(0, 10)); // Keep latest 10
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUPERVISOR_APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'SUPERVISOR_REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'APPROVAL_PENDING':
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data?.user) {
        const userData = response.data.user;
        const updatedUser = {
          ...userData,
          profilePhoto: userData.profilePhoto || userData.passportPhoto,
        };
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Javelin</h1>
                  <p className="text-xs text-emerald-400 font-medium">Manager Portal</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="p-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-3">
                {user?.profilePhoto ? (
                  <img
                    src={getImageUrl(user.profilePhoto)}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-12 h-12 rounded-full object-cover shadow-lg border-2 border-emerald-500"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-emerald-400 font-medium">Manager</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 overflow-y-auto">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      active
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-emerald-400' : 'group-hover:text-emerald-400'}`} />
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.badge && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.badge === 'View' 
                          ? 'bg-slate-700 text-slate-300' 
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Role Notice */}
          <div className="p-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-400 font-medium">View-Only Access</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Most panels are read-only. Contact Director for changes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t border-slate-700/50">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-red-500/10 rounded-xl transition-colors group"
            >
              <LogOut className="w-5 h-5 group-hover:text-red-400" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 md:px-6 py-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Page Title - Desktop and Landscape Tablet */}
            <div className="hidden md:flex items-center gap-3">
              <Building2 className="w-6 h-6 text-emerald-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Manager Dashboard</h2>
                <p className="text-xs text-gray-500">Oversight & Monitoring</p>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-emerald-600 hover:text-emerald-700"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-gray-500">
                            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No notifications</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                                !notif.isRead ? 'bg-emerald-50/50' : ''
                              }`}
                              onClick={() => {
                                if (!notif.isRead) handleMarkAsRead(notif.id);
                                if (notif.actionUrl) {
                                  navigate(notif.actionUrl);
                                  setShowNotifications(false);
                                }
                              }}
                            >
                              <div className="flex gap-3">
                                <div className="flex-shrink-0 mt-1">
                                  {getNotificationIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  {notif.subject && (
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {notif.subject}
                                    </p>
                                  )}
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {notif.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                                    {new Date(notif.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                                {!notif.isRead && (
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-2" />
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-100 text-center">
                          <Link
                            to="/manager/notifications"
                            onClick={() => setShowNotifications(false)}
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            View all notifications
                          </Link>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {user?.profilePhoto ? (
                    <img
                      src={getImageUrl(user.profilePhoto)}
                      alt={`${user?.firstName} ${user?.lastName}`}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>

                {showProfileMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowProfileMenu(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <span className="inline-block mt-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          Manager
                        </span>
                      </div>
                      <Link
                        to="/manager/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-5 lg:p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-3 md:py-4 px-4 md:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-gray-500">
            <p>© 2025 Javelin Security Management System</p>
            <p className="hidden sm:block">Manager Portal v1.0</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
