import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  UserPlus,
  AlertCircle,
  UsersRound,
  CalendarCheck,
  MessageSquare,
  Video,
  CalendarPlus,
  CalendarDays,
  BarChart3,
  PlusCircle,
  Activity,
  PieChart,
  DollarSign,
  List,
  Receipt,
  TrendingUp,
  TrendingDown,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  X,
  MessagesSquare,
  Radio,
  AlertOctagon,
  AlertTriangle,
  MapPin,
  Building2,
  Shield,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { getImageUrl } from '../lib/api';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

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
    path: '/director/dashboard' 
  },
  { 
    name: 'Personnel Management', 
    icon: Users,
    children: [
      { name: 'Register Manager', icon: UserPlus, path: '/director/personnel/register-manager' },
      { name: 'Register Admin', icon: Shield, path: '/director/admin/register' },
      { name: 'Register Operator', icon: UserPlus, path: '/director/operators/register' },
      { name: 'Assign Guards to BEATs', icon: Shield, path: '/director/operators/assign' },
      { name: 'Incomplete Operators', icon: AlertTriangle, path: '/director/operators/incomplete' },
      { name: 'Pending Approvals', icon: AlertCircle, path: '/director/personnel/pending-approvals', badge: 5 },
      { name: 'All Personnel', icon: UsersRound, path: '/director/personnel/all' },
    ]
  },
  { 
    name: 'Locations & Beats', 
    icon: MapPin,
    children: [
      { name: 'All Locations', icon: Building2, path: '/director/locations' },
      { name: 'All Beats', icon: Shield, path: '/director/beats' },
      { name: 'BEAT Guards Intelligence', icon: Users, path: '/director/beats/guards' },
    ]
  },
  { 
    name: 'Attendance', 
    icon: CalendarCheck, 
    path: '/director/attendance' 
  },
  { 
    name: 'Communications', 
    icon: MessageSquare,
    children: [
      { name: 'Messages', icon: MessagesSquare, path: '/director/communications/messages' },
    ]
  },
  { 
    name: 'Meetings', 
    icon: Video,
    children: [
      { name: 'Start Instant Meeting', icon: Video, path: '/director/meetings/instant' },
      { name: 'Create Meeting', icon: CalendarPlus, path: '/director/meetings/create' },
      { name: 'My Meetings', icon: CalendarDays, path: '/director/meetings/list' },
    ]
  },
  { 
    name: 'Polls', 
    icon: BarChart3,
    children: [
      { name: 'Create Poll', icon: PlusCircle, path: '/director/polls/create' },
      { name: 'Active Polls', icon: Activity, path: '/director/polls/active' },
      { name: 'Poll Results', icon: PieChart, path: '/director/polls/results' },
    ]
  },
  { 
    name: 'Security Reports', 
    icon: Shield,
    children: [
      { name: 'All Reports', icon: FileText, path: '/director/reports' },
      { name: 'Create Report', icon: PlusCircle, path: '/director/reports/create' },
      { name: 'Review Reports', icon: AlertCircle, path: '/director/reports/review' },
      { name: 'Analytics', icon: BarChart3, path: '/director/reports/analytics' },
    ]
  },
  { 
    name: 'Transactions & Expenses', 
    icon: DollarSign,
    children: [
      { name: 'Financial Overview', icon: TrendingUp, path: '/director/financial-overview' },
      { name: 'All Transactions', icon: List, path: '/director/transactions/all' },
      { name: 'Money In Reports', icon: TrendingUp, path: '/director/financial/money-in' },
      { name: 'Money Out Reports', icon: TrendingDown, path: '/director/financial/money-out' },
      { name: 'Salary Management', icon: Users, path: '/director/salary' },
      { name: 'BEAT Expenses', icon: Receipt, path: '/director/bit-expenses' },
    ]
  },
];

const footerItems: MenuItem[] = [
  { name: 'Settings', icon: Settings, path: '/director/settings' },
  { name: 'Help & Support', icon: HelpCircle, path: '/director/help' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Personnel Management']);

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
    onClose();
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
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 sm:w-72 lg:w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Profile Header Section */}
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-3 sm:p-4 md:p-5 relative">
          {/* Close Button - Mobile Only */}
          <button
            onClick={onClose}
            className="lg:hidden absolute top-2 sm:top-3 right-2 sm:right-3 w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Profile Section - Display Only */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mt-2 lg:mt-0">
            {/* Profile Photo */}
            <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.profilePhoto ? (
                <img 
                  src={getImageUrl(user.profilePhoto)} 
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-white text-lg sm:text-xl font-bold">${user?.firstName?.charAt(0)}${user?.lastName?.charAt(0)}</span>`;
                  }}
                />
              ) : (
                <span className="text-white text-lg sm:text-xl font-bold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              )}
            </div>
            
            {/* Name and Email */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm sm:text-base truncate">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-blue-100 text-xs sm:text-sm truncate">
                {user?.email}
              </p>
              <span className="inline-block mt-0.5 sm:mt-1 px-1.5 sm:px-2 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] sm:text-xs font-semibold rounded-full">
                Director
              </span>
            </div>
          </div>
        </div>

        {/* Main Menu Items */}
        <nav className="flex-1 overflow-y-auto py-3 sm:py-4 px-2 sm:px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.name}>
                {item.children ? (
                  // Expandable Menu Item
                  <div>
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`w-full flex items-center justify-between px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl transition-all duration-200 ${
                        isParentActive(item)
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                        <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isParentActive(item) ? 'text-blue-600' : 'text-slate-500'}`} />
                        <span className="font-medium text-xs sm:text-sm">{item.name}</span>
                      </div>
                      {expandedMenus.includes(item.name) ? (
                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                      )}
                    </button>
                    
                    {/* Submenu */}
                    {expandedMenus.includes(item.name) && (
                      <ul className="mt-1 ml-3 sm:ml-4 pl-3 sm:pl-4 border-l-2 border-gray-200 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.name}>
                            <Link
                              to={child.path!}
                              onClick={onClose}
                              className={`flex items-center justify-between px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 rounded-lg transition-all duration-200 ${
                                isActiveRoute(child.path)
                                  ? 'bg-yellow-50 text-yellow-700 border-l-2 border-yellow-400 -ml-[2px]'
                                  : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
                              }`}
                            >
                              <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                                <child.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${isActiveRoute(child.path) ? 'text-yellow-600' : 'text-slate-400'}`} />
                                <span className="text-xs sm:text-sm">{child.name}</span>
                              </div>
                              {child.badge && (
                                <span className="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full min-w-[18px] sm:min-w-[20px] text-center">
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
                  // Simple Menu Item
                  <Link
                    to={item.path!}
                    onClick={onClose}
                    className={`flex items-center gap-2 sm:gap-2.5 md:gap-3 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl transition-all duration-200 ${
                      isActiveRoute(item.path)
                        ? 'bg-yellow-400 text-yellow-900 shadow-md shadow-yellow-200'
                        : 'text-slate-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActiveRoute(item.path) ? 'text-yellow-800' : 'text-slate-500'}`} />
                    <span className="font-medium text-xs sm:text-sm">{item.name}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer Section */}
        <div className="border-t border-gray-200 p-2 sm:p-3 space-y-1">
          {footerItems.map((item) => (
            <Link
              key={item.name}
              to={item.path!}
              onClick={onClose}
              className={`flex items-center gap-2 sm:gap-2.5 md:gap-3 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl transition-all duration-200 ${
                isActiveRoute(item.path)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActiveRoute(item.path) ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="text-xs sm:text-sm font-medium">{item.name}</span>
            </Link>
          ))}
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 sm:gap-2.5 md:gap-3 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
