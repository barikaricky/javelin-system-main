import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MapPin,
  ClipboardCheck,
  AlertTriangle,
  Activity,
  MessageSquare,
  Video,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Bell,
  UserPlus,
  Menu,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import NotificationPanel from '../../components/layout/NotificationPanel';
import { api } from '../../lib/api';

const navigation = [
  { name: 'Dashboard', href: '/supervisor/dashboard', icon: LayoutDashboard },
  {
    name: 'Operators',
    icon: Users,
    children: [
      { name: 'Register Operator', href: '/supervisor/operators/register', icon: UserPlus },
      { name: 'My Operators', href: '/supervisor/operators/my-operators', icon: Users },
      { name: 'Operator List', href: '/supervisor/operators', icon: Users },
      { name: 'Request Assignment', href: '/supervisor/assignments/request', icon: MapPin },
      { name: 'Pending Assignments', href: '/supervisor/assignments/pending', icon: ClipboardCheck },
      { name: 'Registration Status', href: '/supervisor/operators/status', icon: ClipboardCheck },
    ],
  },
  {
    name: 'Locations / Bits',
    icon: MapPin,
    children: [
      { name: 'My Bits', href: '/supervisor/bits', icon: MapPin },
      { name: 'Bit Visit Logs', href: '/supervisor/bits/visits', icon: Activity },
    ],
  },
  { name: 'Attendance', href: '/supervisor/attendance', icon: ClipboardCheck },
  { name: 'Incidents', href: '/supervisor/incidents', icon: AlertTriangle },
  { name: 'Messages', href: '/supervisor/messages', icon: MessageSquare },
  { name: 'Meetings', href: '/supervisor/meetings', icon: Video },
  { name: 'Reports', href: '/supervisor/reports', icon: FileText },
  { name: 'ID Card', href: '/supervisor/id-cards', icon: CreditCard },
  { name: 'Settings', href: '/supervisor/settings', icon: Settings },
];

export default function SupervisorLayout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Operators']);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await api.get('/notifications/unread-count');
        setUnreadCount(response.data.count || 0);
      } catch (error) {
        console.error('Failed to fetch unread notifications:', error);
      }
    };

    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClose = () => {
    setShowNotifications(false);
    // Refresh count when closing notifications
    api.get('/notifications/unread-count').then(response => {
      setUnreadCount(response.data.count || 0);
    }).catch(console.error);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    window.location.reload();
  };

  const toggleMenu = (name: string) => {
    setExpandedMenus(prev =>
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-green-600 to-green-700 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-green-500">
            <h1 className="text-xl font-bold">Supervisor Portal</h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg hover:bg-green-500 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} />
                        <span>{item.name}</span>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          expandedMenus.includes(item.name) ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                    {expandedMenus.includes(item.name) && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.name}
                            to={child.href}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                                isActive
                                  ? 'bg-green-500 text-white'
                                  : 'text-green-100 hover:bg-green-500'
                              }`
                            }
                          >
                            <child.icon size={18} />
                            <span>{child.name}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-green-500 text-white'
                          : 'text-green-100 hover:bg-green-500'
                      }`
                    }
                  >
                    <item.icon size={20} />
                    <span>{item.name}</span>
                  </NavLink>
                )}
              </div>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-green-500">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-lg hover:bg-green-500 transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu size={24} />
            </button>

            <div className="flex items-center gap-4 ml-auto">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-gray-100 relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 z-50">
                    <NotificationPanel onClose={handleNotificationClose} />
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="flex items-center gap-3">
                {user?.profilePhoto ? (
                  <img
                    src={user.profilePhoto.startsWith('http') || user.profilePhoto.startsWith('data:') 
                      ? user.profilePhoto 
                      : `${window.location.origin.replace('-3000.', '-3002.')}${user.profilePhoto}`}
                    alt={`${user?.firstName} ${user?.lastName}`}
                    className="w-8 h-8 rounded-full object-cover border-2 border-green-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold ${user?.profilePhoto ? 'hidden' : ''}`}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">Supervisor</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
