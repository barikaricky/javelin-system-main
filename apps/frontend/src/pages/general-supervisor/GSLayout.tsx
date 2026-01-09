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
import NotificationPanel from '../../components/layout/NotificationPanel';

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
      { name: 'Visit Logs', icon: MapPin, path: '/general-supervisor/supervisors/visit-logs' },
      { name: 'Assign to Locations', icon: Target, path: '/general-supervisor/supervisors/assign' },
    ]
  },
  { 
    name: 'Operators', 
    icon: UserCheck,
    children: [
      { name: 'Operator List', icon: Users, path: '/general-supervisor/operators' },
      { name: 'Register Operator', icon: UserCheck, path: '/general-supervisor/operators/register' },
      { name: 'Operator Approval', icon: Shield, path: '/general-supervisor/operators/approval', badge: 0 },
      { name: 'Assignment Requests', icon: Clock, path: '/general-supervisor/assignments/requests', badge: 0 },
      { name: 'Assign to BEAT', icon: Target, path: '/general-supervisor/assignments/assign' },
      { name: 'Operator Attendance', icon: ClipboardCheck, path: '/general-supervisor/operators/attendance' },
      { name: 'Operator Incidents', icon: AlertTriangle, path: '/general-supervisor/operators/incidents' },
    ]
  },
  { 
    name: 'Locations / Beats', 
    icon: MapPin,
    children: [
      { name: 'All Locations', icon: Map, path: '/general-supervisor/locations' },
      { name: 'Staffing Overview', icon: Users, path: '/general-supervisor/locations/staffing' },
      { name: 'Understaffed Beats', icon: AlertTriangle, path: '/general-supervisor/locations/understaffed' },
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
    name: 'Incidents (Coming Soon)', 
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
    name: 'Communication', 
    icon: MessageSquare,
    children: [
      { name: 'Messages from Manager', icon: MessageSquare, path: '/general-supervisor/communication/inbox' },
    ]
  },
  { 
    name: 'Security Reports', 
    icon: FileText,
    children: [
      { name: 'All Reports', icon: FileText, path: '/general-supervisor/reports' },
      { name: 'Create Report', icon: Send, path: '/general-supervisor/reports/create' },
      { name: 'Analytics', icon: BarChart3, path: '/general-supervisor/reports/analytics' },
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
      {/* Overlay for mobile with animation */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar with enhanced mobile responsiveness */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 sm:w-72 bg-white shadow-2xl z-50 transform transition-all duration-300 ease-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-auto lg:w-64 xl:w-72`}
      >
        {/* Profile Header Section with gradient animation */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-4 sm:p-5 relative animate-gradient">
          {/* Close Button - Mobile Only with hover animation */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-3 right-3 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Profile Section */}
          <div className="flex items-center gap-3 sm:gap-4 mt-2 lg:mt-0 animate-slideInLeft">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center overflow-hidden flex-shrink-0 transition-transform duration-300 hover:scale-105">
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
                <span className="text-white text-lg sm:text-xl font-bold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm sm:text-base truncate">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-purple-200 text-xs sm:text-sm truncate">
                {user?.email}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-purple-400 text-white text-xs font-semibold rounded-full">
                General Supervisor
              </span>
            </div>
          </div>
        </div>

        {/* Main Menu Items with scroll */}
        <nav className="flex-1 overflow-y-auto py-3 sm:py-4 px-2 sm:px-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <ul className="space-y-1">
            {menuItems.map((item, index) => (
              <li key={item.name} className="animate-slideInLeft" style={{ animationDelay: `${index * 50}ms` }}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                        isParentActive(item)
                          ? 'bg-purple-50 text-purple-700 shadow-sm'
                          : 'text-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${isParentActive(item) ? 'text-purple-600 scale-110' : 'text-slate-500'}`} />
                        <span className="font-medium text-xs sm:text-sm">{item.name}</span>
                      </div>
                      <div className={`transition-transform duration-200 ${expandedMenus.includes(item.name) ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                    
                    {/* Animated submenu */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      expandedMenus.includes(item.name) ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'
                    }`}>
                      <ul className="ml-3 sm:ml-4 pl-3 sm:pl-4 border-l-2 border-gray-200 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.name} className="animate-fadeIn">
                            <Link
                              to={child.path!}
                              onClick={() => setSidebarOpen(false)}
                              className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all duration-200 hover:translate-x-1 ${
                                isActiveRoute(child.path)
                                  ? 'bg-purple-100 text-purple-700 border-l-2 border-purple-500 -ml-[2px] shadow-sm'
                                  : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
                              }`}
                            >
                              <div className="flex items-center gap-2 sm:gap-3">
                                <child.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActiveRoute(child.path) ? 'text-purple-600' : 'text-slate-400'}`} />
                                <span className="text-xs sm:text-sm">{child.name}</span>
                              </div>
                              {child.badge && (
                                <span className="bg-red-500 text-white text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full animate-pulse">
                                  {child.badge}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <Link
                    to={item.path!}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                      isActiveRoute(item.path)
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                        : 'text-slate-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActiveRoute(item.path) ? 'text-white' : 'text-slate-500'}`} />
                    <span className="font-medium text-xs sm:text-sm">{item.name}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer Section with animation */}
        <div className="border-t border-gray-200 p-2 sm:p-3 animate-slideInUp">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - Mobile optimized */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-20">
          {/* Mobile Menu Button with animation */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          </button>

          {/* Page Title */}
          <div className="lg:block">
            <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">GS Portal</h1>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications Panel */}
            <NotificationPanel />

            {/* Profile Quick Access */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-gray-200">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden transition-transform duration-200 hover:scale-110">
                {user?.profilePhoto ? (
                  <img 
                    src={getImageUrl(user.profilePhoto)} 
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-purple-600 font-semibold text-xs sm:text-sm">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                )}
              </div>
              <div className="hidden md:block">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[100px] lg:max-w-none">{user?.firstName}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">General Supervisor</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content with mobile padding */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation - Enhanced with animations */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-30 shadow-lg">
          <div className="flex items-center justify-around max-w-lg mx-auto">
            <Link
              to="/general-supervisor/dashboard"
              className={`flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                isActiveRoute('/general-supervisor/dashboard') 
                  ? 'text-purple-600 bg-purple-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Home className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 ${
                isActiveRoute('/general-supervisor/dashboard') ? 'scale-110' : ''
              }`} />
              <span className="text-[10px] sm:text-xs font-medium">Home</span>
            </Link>
            <Link
              to="/general-supervisor/supervisors"
              className={`flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                location.pathname.includes('/supervisors') 
                  ? 'text-purple-600 bg-purple-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 ${
                location.pathname.includes('/supervisors') ? 'scale-110' : ''
              }`} />
              <span className="text-[10px] sm:text-xs font-medium">Team</span>
            </Link>
            <Link
              to="/general-supervisor/locations"
              className={`flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                location.pathname.includes('/locations') 
                  ? 'text-purple-600 bg-purple-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MapPin className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 ${
                location.pathname.includes('/locations') ? 'scale-110' : ''
              }`} />
              <span className="text-[10px] sm:text-xs font-medium">Locations</span>
            </Link>
            <Link
              to="/general-supervisor/incidents"
              className={`flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                location.pathname.includes('/incidents') 
                  ? 'text-purple-600 bg-purple-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <AlertTriangle className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 ${
                location.pathname.includes('/incidents') ? 'scale-110' : ''
              }`} />
              <span className="text-[10px] sm:text-xs font-medium">Incidents</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-gray-500 hover:text-gray-700 transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[10px] sm:text-xs font-medium">More</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}