import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Home,
  Users,
  UserCheck,
  MapPin,
  ClipboardCheck,
  AlertTriangle,
  Activity,
  MessageSquare,
  FileText,
  CreditCard,
  Settings,
  ChevronDown,
  ChevronRight,
  X,
  Menu,
  Bell,
  LogOut,
  User,
  Eye,
  Calendar,
  BarChart3,
  Send,
  Shield,
  Clock,
  Map,
  Target,
  TrendingUp,
  Printer,
  Lock,
  HelpCircle,
  Palette,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getImageUrl } from '../../lib/api';

interface MenuItem {
  name: string;
  icon: any;
  path?: string;
  badge?: number;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { 
    name: 'Dashboard', 
    icon: Home, 
    path: '/general-supervisor/dashboard' 
  },
  { 
    name: 'Supervisors', 
    icon: Users,
    children: [
      { name: 'All Supervisors', icon: Users, path: '/general-supervisor/supervisors' },
      { name: 'Register Supervisor', icon: UserCheck, path: '/general-supervisor/supervisors/register' },
      { name: 'Supervisor Profiles', icon: User, path: '/general-supervisor/supervisors/profiles' },
      { name: 'Supervisor Activity', icon: Activity, path: '/general-supervisor/supervisors/activity' },
      { name: 'Visit Logs', icon: MapPin, path: '/general-supervisor/supervisors/visit-logs' },
      { name: 'Performance Scores', icon: TrendingUp, path: '/general-supervisor/supervisors/performance' },
      { name: 'Assign to Locations', icon: Target, path: '/general-supervisor/supervisors/assign' },
    ]
  },
  { 
    name: 'Operators', 
    icon: UserCheck,
    children: [
      { name: 'Operator List', icon: Users, path: '/general-supervisor/operators' },
      { name: 'Operator Approval', icon: Shield, path: '/general-supervisor/operators/approval', badge: 0 },
      { name: 'Assign to BIT', icon: Target, path: '/general-supervisor/assignments/assign' },
      { name: 'Assignment Approvals', icon: Clock, path: '/general-supervisor/assignments/approvals', badge: 0 },
      { name: 'Operator Profiles', icon: User, path: '/general-supervisor/operators/profiles' },
      { name: 'Operator Attendance', icon: ClipboardCheck, path: '/general-supervisor/operators/attendance' },
      { name: 'Location Assignment', icon: MapPin, path: '/general-supervisor/operators/locations' },
      { name: 'Operator Incidents', icon: AlertTriangle, path: '/general-supervisor/operators/incidents' },
    ]
  },
  { 
    name: 'Locations / Bits', 
    icon: MapPin,
    children: [
      { name: 'All Locations', icon: Map, path: '/general-supervisor/locations' },
      { name: 'Staffing Overview', icon: Users, path: '/general-supervisor/locations/staffing' },
      { name: 'Understaffed Bits', icon: AlertTriangle, path: '/general-supervisor/locations/understaffed' },
      { name: 'Supervisor Assignment', icon: Target, path: '/general-supervisor/locations/assignments' },
      { name: 'Location Status', icon: Activity, path: '/general-supervisor/locations/status' },
    ]
  },
  { 
    name: 'Attendance', 
    icon: ClipboardCheck,
    children: [
      { name: 'Operator Attendance', icon: UserCheck, path: '/general-supervisor/attendance/operators' },
      { name: 'Supervisor Attendance', icon: Users, path: '/general-supervisor/attendance/supervisors' },
      { name: 'Attendance Issues', icon: AlertTriangle, path: '/general-supervisor/attendance/issues' },
      { name: 'Monthly Summary', icon: Calendar, path: '/general-supervisor/attendance/monthly' },
      { name: 'By Location', icon: MapPin, path: '/general-supervisor/attendance/locations' },
    ]
  },
  { 
    name: 'Incidents', 
    icon: AlertTriangle,
    children: [
      { name: 'All Incidents', icon: AlertTriangle, path: '/general-supervisor/incidents' },
      { name: 'High Priority', icon: Shield, path: '/general-supervisor/incidents/high-priority' },
      { name: 'By Supervisor', icon: Users, path: '/general-supervisor/incidents/by-supervisor' },
      { name: 'By Location', icon: MapPin, path: '/general-supervisor/incidents/by-location' },
      { name: 'Escalate Incident', icon: TrendingUp, path: '/general-supervisor/incidents/escalate' },
    ]
  },
  { 
    name: 'Activity Logs', 
    icon: Activity,
    children: [
      { name: 'Supervisor Logs', icon: Users, path: '/general-supervisor/activity/supervisors' },
      { name: 'Operator Logs', icon: UserCheck, path: '/general-supervisor/activity/operators' },
      { name: 'Location Activities', icon: MapPin, path: '/general-supervisor/activity/locations' },
      { name: 'Visit History', icon: Clock, path: '/general-supervisor/activity/visits' },
    ]
  },
  { 
    name: 'Communication', 
    icon: MessageSquare,
    children: [
      { name: 'Messages from Manager', icon: MessageSquare, path: '/general-supervisor/communication/inbox' },
      { name: 'Message Supervisors', icon: Send, path: '/general-supervisor/communication/send' },
      { name: 'Broadcast', icon: Users, path: '/general-supervisor/communication/broadcast' },
      { name: 'Meeting Invitations', icon: Calendar, path: '/general-supervisor/communication/meetings' },
    ]
  },
  { 
    name: 'Reports', 
    icon: FileText,
    children: [
      { name: 'Weekly Report', icon: Calendar, path: '/general-supervisor/reports/weekly' },
      { name: 'Performance Report', icon: TrendingUp, path: '/general-supervisor/reports/performance' },
      { name: 'Location Visit Report', icon: MapPin, path: '/general-supervisor/reports/visits' },
      { name: 'Supervisor Ranking', icon: BarChart3, path: '/general-supervisor/reports/ranking' },
    ]
  },
  { 
    name: 'ID Card', 
    icon: CreditCard,
    path: '/general-supervisor/id-cards'
  },
  { 
    name: 'Settings', 
    icon: Settings,
    path: '/general-supervisor/settings'
  }
];

export default function GSLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Supervisors']);
  const [notificationCount] = useState(3);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
    setSidebarOpen(false);
  };

  const isActiveRoute = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isParentActive = (item: MenuItem) => {
    if (item.children) {
      return item.children.some(child => isActiveRoute(child.path));
    }
    return isActiveRoute(item.path);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Profile Header Section */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-5 relative">
          {/* Close Button - Mobile Only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-3 right-3 w-11 h-11 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Profile Section */}
          <div className="flex items-center gap-4 mt-2 lg:mt-0">
            <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.profilePhoto ? (
                <img 
                  src={getImageUrl(user.profilePhoto)} 
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-white text-xl font-bold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-base truncate">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-purple-200 text-sm truncate">
                {user?.email}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-purple-400 text-white text-xs font-semibold rounded-full">
                General Supervisor
              </span>
            </div>
          </div>
        </div>

        {/* Main Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.name}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                        isParentActive(item)
                          ? 'bg-purple-50 text-purple-700'
                          : 'text-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-5 h-5 ${isParentActive(item) ? 'text-purple-600' : 'text-slate-500'}`} />
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                      {expandedMenus.includes(item.name) ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    
                    {expandedMenus.includes(item.name) && (
                      <ul className="mt-1 ml-4 pl-4 border-l-2 border-gray-200 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.name}>
                            <Link
                              to={child.path!}
                              onClick={() => setSidebarOpen(false)}
                              className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 ${
                                isActiveRoute(child.path)
                                  ? 'bg-purple-100 text-purple-700 border-l-2 border-purple-500 -ml-[2px]'
                                  : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <child.icon className={`w-4 h-4 ${isActiveRoute(child.path) ? 'text-purple-600' : 'text-slate-400'}`} />
                                <span className="text-sm">{child.name}</span>
                              </div>
                              {child.badge && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                  {child.badge}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path!}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActiveRoute(item.path)
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                        : 'text-slate-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActiveRoute(item.path) ? 'text-white' : 'text-slate-500'}`} />
                    <span className="font-medium text-sm">{item.name}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer Section */}
        <div className="border-t border-gray-200 p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>

          {/* Page Title - Hidden on mobile */}
          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold text-gray-900">General Supervisor Portal</h1>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-6 h-6 text-gray-600" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Profile Quick Access */}
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                {user?.profilePhoto ? (
                  <img 
                    src={getImageUrl(user.profilePhoto)} 
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-purple-600 font-semibold text-sm">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                )}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user?.firstName}</p>
                <p className="text-xs text-gray-500">General Supervisor</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-30">
          <div className="flex items-center justify-around">
            <Link
              to="/general-supervisor/dashboard"
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
                isActiveRoute('/general-supervisor/dashboard') ? 'text-purple-600' : 'text-gray-500'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Link>
            <Link
              to="/general-supervisor/supervisors"
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
                location.pathname.includes('/supervisors') ? 'text-purple-600' : 'text-gray-500'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Team</span>
            </Link>
            <Link
              to="/general-supervisor/locations"
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
                location.pathname.includes('/locations') ? 'text-purple-600' : 'text-gray-500'
              }`}
            >
              <MapPin className="w-5 h-5" />
              <span className="text-xs">Locations</span>
            </Link>
            <Link
              to="/general-supervisor/incidents"
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
                location.pathname.includes('/incidents') ? 'text-purple-600' : 'text-gray-500'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              <span className="text-xs">Incidents</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-500"
            >
              <Menu className="w-5 h-5" />
              <span className="text-xs">More</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
