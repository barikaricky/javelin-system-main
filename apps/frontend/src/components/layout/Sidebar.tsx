import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  UserPlus,
  AlertCircle,
  UsersRound,
  CalendarCheck,
  MessageSquare,
  History,
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
  Settings,
  LogOut,
  ChevronDown,
  X,
  Menu,
  MapPin,
  Building2,
  AlertTriangle,
  FileText,
  Shield,
  UserCog,
  Crown,
  Megaphone,
  Clock,
  Fingerprint,
  Printer,
  Camera,
  Lock,
  Palette,
  Globe,
  User,
  Eye,
  CheckCircle,
  XCircle,
  Map,
  Users2,
  Headphones,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { getImageUrl } from '../../lib/api';

interface MenuItem {
  name: string;
  icon: any;
  path?: string;
  badge?: number;
  children?: MenuItem[];
}

const directorMenuItems: MenuItem[] = [
  { 
    name: 'Dashboard', 
    icon: Home, 
    path: '/director/dashboard' 
  },
  { 
    name: 'Staff Management', 
    icon: Users,
    children: [
      { name: 'Managers', icon: UserCog, path: '/director/personnel/managers' },
      { name: 'General Supervisors', icon: Crown, path: '/director/personnel/general-supervisors' },
      { name: 'Supervisors', icon: Shield, path: '/director/personnel/supervisors' },
      { name: 'Operators', icon: Users, path: '/director/personnel/operators' },
      { name: 'Register Manager', icon: UserPlus, path: '/director/personnel/register-manager' },
      { name: 'Register Admin', icon: Shield, path: '/director/admin/register' },
      { name: 'Pending Approvals', icon: AlertCircle, path: '/director/personnel/pending-approvals' },
      { name: 'All Personnel', icon: UsersRound, path: '/director/personnel/all' },
    ]
  },
  { 
    name: 'Locations / Bits', 
    icon: MapPin,
    children: [
      { name: 'All Locations', icon: Map, path: '/director/locations' },
      { name: 'All Bits', icon: Shield, path: '/director/bits' },
      { name: 'Understaffed', icon: AlertTriangle, path: '/director/locations/understaffed' },
      { name: 'Overstaffed', icon: Users2, path: '/director/locations/overstaffed' },
      { name: 'Create Location', icon: PlusCircle, path: '/director/locations/new' },
      { name: 'Region Overview', icon: Globe, path: '/director/locations/regions' },
    ]
  },
  { 
    name: 'Attendance', 
    icon: CalendarCheck,
    children: [
      { name: 'All Staff Attendance', icon: UsersRound, path: '/director/attendance' },
      { name: 'Supervisor Attendance', icon: Shield, path: '/director/attendance/supervisors' },
      { name: 'Operator Attendance', icon: Users, path: '/director/attendance/operators' },
      { name: 'Daily Report', icon: FileText, path: '/director/attendance/daily' },
      { name: 'Monthly Report', icon: BarChart3, path: '/director/attendance/monthly' },
    ]
  },
  { 
    name: 'Incidents', 
    icon: AlertTriangle,
    children: [
      { name: 'All Incidents', icon: List, path: '/director/incidents' },
      { name: 'High Priority', icon: AlertCircle, path: '/director/incidents/high-priority' },
      { name: 'Open Cases', icon: Clock, path: '/director/incidents/open' },
      { name: 'Resolved Cases', icon: CheckCircle, path: '/director/incidents/resolved' },
      { name: 'Incident Analytics', icon: PieChart, path: '/director/incidents/analytics' },
    ]
  },
  { 
    name: 'Meetings', 
    icon: Video,
    children: [
      { name: 'Create Meeting', icon: CalendarPlus, path: '/director/meetings/create' },
      { name: 'My Meetings', icon: CalendarDays, path: '/director/meetings/list' },
      { name: 'Meeting Recordings', icon: Video, path: '/director/meetings/recordings' },
      { name: 'Meeting Reports', icon: FileText, path: '/director/meetings/reports' },
    ]
  },
  { 
    name: 'Messaging', 
    icon: MessageSquare,
    children: [
      { name: 'Messages', icon: MessageSquare, path: '/director/communications/messages' },
      { name: 'Groups', icon: Users, path: '/director/communications/groups' },
      { name: 'Broadcast', icon: Megaphone, path: '/director/communications/broadcast' },
      { name: 'Emergency Alert', icon: AlertTriangle, path: '/director/communications/emergency' },
      { name: 'Message Logs', icon: History, path: '/director/communications/logs' },
    ]
  },
  { 
    name: 'Polls & Surveys', 
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
      { name: 'Analytics', icon: BarChart3, path: '/director/reports/analytics' },
    ]
  },
  { 
    name: 'Reports & Analytics', 
    icon: TrendingUp,
    children: [
      { name: 'Staff Reports', icon: Users, path: '/director/reports/staff' },
      { name: 'Attendance Reports', icon: CalendarCheck, path: '/director/reports/attendance' },
      { name: 'Incident Reports', icon: AlertTriangle, path: '/director/reports/incidents' },
      { name: 'Performance', icon: TrendingUp, path: '/director/reports/performance' },
      { name: 'Regional Reports', icon: Globe, path: '/director/reports/regional' },
    ]
  },
  { 
    name: 'Expenses & Finance', 
    icon: DollarSign,
    children: [
      { name: 'All Expenses', icon: List, path: '/director/transactions/all' },
      { name: 'Submit Expense', icon: Receipt, path: '/director/transactions/expenses' },
      { name: 'Financial Overview', icon: TrendingUp, path: '/director/transactions/overview' },
      { name: 'Salary Structure', icon: DollarSign, path: '/director/finance/salary' },
    ]
  },
  { 
    name: 'System Settings', 
    icon: Settings,
    children: [
      { name: 'Company Profile', icon: Building2, path: '/director/settings/company' },
      { name: 'Roles & Permissions', icon: Lock, path: '/director/settings/roles' },
      { name: 'Region Management', icon: Globe, path: '/director/settings/regions' },
      { name: 'Security', icon: Shield, path: '/director/settings/security' },
      { name: 'Appearance', icon: Palette, path: '/director/settings/appearance' },
    ]
  },
  { 
    name: 'ID Cards', 
    icon: Fingerprint,
    children: [
      { name: 'View All ID Cards', icon: Eye, path: '/director/id-cards' },
      { name: 'Generate ID', icon: PlusCircle, path: '/director/id-cards/generate' },
      { name: 'Print ID', icon: Printer, path: '/director/id-cards/print' },
      { name: 'Approve Photos', icon: Camera, path: '/director/id-cards/approve-photos' },
    ]
  },
];

const footerItems: MenuItem[] = [
  { name: 'My Profile', icon: User, path: '/director/profile' },
  { name: 'Settings', icon: Settings, path: '/director/settings' },
  { name: 'Help & Support', icon: Headphones, path: '/director/help' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Personnel Management']);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  // Fetch pending approvals count for directors
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await api.get('/supervisors/pending-approvals');
        const pendingList = Array.isArray(response.data) ? response.data : [];
        setPendingApprovalsCount(pendingList.length);
      } catch (error) {
        console.error('Error fetching pending approvals count:', error);
      }
    };

    // Only fetch for directors
    if (user?.role === 'DIRECTOR') {
      fetchPendingCount();
      // Refresh count every 30 seconds
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.role]);

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
    setIsMobileOpen(false);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
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

  // Get menu items based on role
  const getMenuItems = (): MenuItem[] => {
    switch (user?.role) {
      case 'DIRECTOR':
        return directorMenuItems;
      default:
        return directorMenuItems; // Default to director for now
    }
  };

  const menuItems = getMenuItems();

  const SidebarContent = () => (
    <>
      {/* Profile Header Section */}
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-5 relative">
        {/* Close Button - Mobile Only */}
        <button
          onClick={closeMobileSidebar}
          className="md:hidden absolute top-3 right-3 w-11 h-11 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Profile Section - Display Only */}
        <div className="flex items-center gap-4 mt-2 md:mt-0">
          {/* Profile Photo */}
          <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center overflow-hidden flex-shrink-0">
            {user?.profilePhoto ? (
              <img 
                src={getImageUrl(user.profilePhoto)} 
                alt={`${user.firstName} ${user.lastName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-xl font-bold">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </span>
            )}
          </div>
          
          {/* Name and Email */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-base truncate">
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="text-blue-100 text-sm truncate">
              {user?.email}
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full">
              {user?.role || 'Director'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item, index) => (
            <li key={item.name} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
              {item.children ? (
                // Expandable Menu Item
                <div>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                      isParentActive(item)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${isParentActive(item) ? 'text-blue-600' : 'text-slate-500'}`} />
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                    <span className={`transition-transform duration-300 ${expandedMenus.includes(item.name) ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </span>
                  </button>
                  
                  {/* Submenu with animation */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedMenus.includes(item.name) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <ul className="mt-1 ml-4 pl-4 border-l-2 border-gray-200 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.name}>
                          <Link
                            to={child.path!}
                            onClick={closeMobileSidebar}
                            className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 active:scale-[0.98] ${
                              isActiveRoute(child.path)
                                ? 'bg-yellow-50 text-yellow-700 border-l-2 border-yellow-400 -ml-[2px]'
                                : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <child.icon className={`w-4 h-4 ${isActiveRoute(child.path) ? 'text-yellow-600' : 'text-slate-400'}`} />
                              <span className="text-sm">{child.name}</span>
                            </div>
                            {(child.badge || (child.name === 'Pending Approvals' && pendingApprovalsCount > 0)) && (
                              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
                                {child.name === 'Pending Approvals' ? pendingApprovalsCount : child.badge}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                // Simple Menu Item
                <Link
                  to={item.path!}
                  onClick={closeMobileSidebar}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                    isActiveRoute(item.path)
                      ? 'bg-yellow-400 text-yellow-900 shadow-md shadow-yellow-200'
                      : 'text-slate-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActiveRoute(item.path) ? 'text-yellow-800' : 'text-slate-500'}`} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer Section */}
      <div className="border-t border-gray-200 p-3 space-y-1">
        {footerItems.map((item) => (
          <Link
            key={item.name}
            to={item.path!}
            onClick={closeMobileSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] ${
              isActiveRoute(item.path)
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-gray-100'
            }`}
          >
            <item.icon className={`w-5 h-5 ${isActiveRoute(item.path) ? 'text-blue-600' : 'text-slate-400'}`} />
            <span className="text-sm font-medium">{item.name}</span>
          </Link>
        ))}
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 active:scale-[0.98]"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Toggle Button - Fixed at top left */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 w-11 h-11 bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white shadow-xl min-h-screen border-r border-gray-200">
        <SidebarContent />
      </aside>
    </>
  );
}
