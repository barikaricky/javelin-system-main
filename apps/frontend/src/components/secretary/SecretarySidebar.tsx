import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CreditCard,
  FolderOpen,
  FileWarning,
  Calendar,
  CalendarDays,
  BarChart3,
  Users,
  UserPlus,
  FileText,
  Clock,
  Send,
  AlertCircle,
  CheckCircle,
  Briefcase,
  PlusCircle,
  Activity,
  TrendingUp,
  MessageSquare,
  Video,
  CreditCard as IDCardIcon,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  X,
  MapPin,
  Building2,
  Shield,
  FileText as FileIcon,
  Upload,
  AlertCircle as AlertIcon,
  Receipt,
  UserCheck,
  UserCog,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getImageUrl } from '../../lib/api';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  name: string;
  icon: any;
  path?: string;
  badge?: string | number;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { 
    name: 'Dashboard', 
    icon: Home, 
    path: '/secretary/dashboard' 
  },
  {
    name: 'Personnel Management',
    icon: Users,
    children: [
      { name: 'Register Operator', icon: UserPlus, path: '/secretary/operators/register', badge: 'New' },
      { name: 'All Operators', icon: Users, path: '/secretary/operators' },
      { name: 'All Supervisors', icon: Shield, path: '/secretary/supervisors', badge: 'New' },
      { name: 'General Supervisors', icon: ShieldCheck, path: '/secretary/general-supervisors', badge: 'New' },
      { name: 'All Managers', icon: UserCog, path: '/secretary/managers', badge: 'New' },
      { name: 'Assign Operators', icon: UserCheck, path: '/secretary/assignments/assign', badge: 'New' },
    ]
  },
  { 
    name: 'Financial Management', 
    icon: DollarSign,
    children: [
      { name: 'Financial Overview', icon: TrendingUp, path: '/secretary/financial-overview' },
      { name: 'Daily Logs', icon: Calendar, path: '/secretary/daily-logs' },
      { name: 'Monthly Logs', icon: CalendarDays, path: '/secretary/monthly-logs' },
      { name: 'Salary Panel', icon: Banknote, path: '/secretary/salary' },
      { name: 'BIT Expenses', icon: Receipt, path: '/secretary/bit-expenses' },
    ]
  },
  { 
    name: 'Money Tracking', 
    icon: ArrowDownCircle,
    children: [
      { name: 'Money In', icon: ArrowDownCircle, path: '/secretary/money-in' },
      { name: 'Record Money In', icon: PlusCircle, path: '/secretary/money-in/record' },
      { name: 'Money Out', icon: ArrowUpCircle, path: '/secretary/money-out' },
      { name: 'Record Money Out', icon: PlusCircle, path: '/secretary/money-out/record' },
    ]
  },
  { 
    name: 'Client Management', 
    icon: Briefcase,
    children: [
      { name: 'All Clients', icon: Users, path: '/secretary/clients' },
      { name: 'Add Client', icon: UserPlus, path: '/secretary/clients/add' },
    ]
  },
  { 
    name: 'Invoices', 
    icon: FileText,
    children: [
      { name: 'Invoice Tracker', icon: Activity, path: '/secretary/invoices' },
      { name: 'Pending Invoices', icon: Clock, path: '/secretary/invoices/pending' },
      { name: 'Sent Invoices', icon: Send, path: '/secretary/invoices/sent' },
      { name: 'Overdue Invoices', icon: AlertCircle, path: '/secretary/invoices/overdue', badge: 2 },
      { name: 'Paid Invoices', icon: CheckCircle, path: '/secretary/invoices/paid' },
    ]
  },
  { 
    name: 'Budgets', 
    icon: CreditCard,
    children: [
      { name: 'Create Budget', icon: PlusCircle, path: '/secretary/budgets/create' },
      { name: 'Active Budgets', icon: Activity, path: '/secretary/budgets/active' },
      { name: 'Budget Breakdown', icon: BarChart3, path: '/secretary/budgets/breakdown' },
      { name: 'Budget vs Spending', icon: TrendingUp, path: '/secretary/budgets/vs-spending' },
    ]
  },
  { 
    name: 'Locations & Bits', 
    icon: MapPin,
    children: [
      { name: 'All Locations', icon: Building2, path: '/secretary/locations' },
      { name: 'Add Location', icon: PlusCircle, path: '/secretary/locations/create' },
      { name: 'All Bits', icon: Shield, path: '/secretary/bits' },
      { name: 'Add Bit', icon: PlusCircle, path: '/secretary/bits/create' },
    ]
  },
  { 
    name: 'Documents', 
    icon: FileIcon,
    children: [
      { name: 'All Documents', icon: FileIcon, path: '/secretary/documents' },
      { name: 'Upload Document', icon: Upload, path: '/secretary/documents/upload' },
      { name: 'Expiring Soon', icon: AlertIcon, path: '/secretary/documents/expiring', badge: 0 },
    ]
  },
  { 
    name: 'Security Reports', 
    icon: FileText,
    children: [
      { name: 'All Reports', icon: FileText, path: '/secretary/reports' },
      { name: 'Create Report', icon: PlusCircle, path: '/secretary/reports/create', badge: 'New' },
      { name: 'Analytics', icon: BarChart3, path: '/secretary/reports/analytics' },
    ]
  },
  { 
    name: 'Communications', 
    icon: MessageSquare,
    children: [
      { name: 'Messages', icon: MessageSquare, path: '/secretary/messages' },
      { name: 'Meetings', icon: Video, path: '/secretary/meetings' },
    ]
  },
  { 
    name: 'ID Cards', 
    icon: IDCardIcon, 
    path: '/secretary/id-cards' 
  },
];

const footerItems: MenuItem[] = [
  { name: 'Settings', icon: Settings, path: '/secretary/settings' },
];

export default function SecretarySidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Financial Management']);

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
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Profile Header Section */}
        <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 p-5 relative">
          {/* Close Button - Mobile Only */}
          <button
            onClick={onClose}
            className="lg:hidden absolute top-3 right-3 w-11 h-11 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Profile Section */}
          <div className="flex items-center gap-4 mt-2 lg:mt-0">
            {/* Profile Photo */}
            <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.profilePhoto || user?.profilePicture ? (
                <img 
                  src={
                    user?.profilePhoto?.startsWith('data:') || user?.profilePicture?.startsWith('data:')
                      ? (user?.profilePhoto || user?.profilePicture)
                      : getImageUrl(user?.profilePhoto || user?.profilePicture)
                  }
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-white text-xl font-bold">${user?.firstName?.charAt(0)}${user?.lastName?.charAt(0)}</span>`;
                  }}
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
              <p className="text-purple-100 text-sm truncate">
                {user?.email}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full">
                Secretary
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
                  // Expandable Menu Item
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
                    
                    {/* Submenu */}
                    {expandedMenus.includes(item.name) && (
                      <ul className="mt-1 ml-4 pl-4 border-l-2 border-gray-200 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.name}>
                            <Link
                              to={child.path!}
                              onClick={onClose}
                              className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 ${
                                isActiveRoute(child.path)
                                  ? 'bg-yellow-50 text-yellow-700 border-l-2 border-yellow-400 -ml-[2px]'
                                  : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <child.icon className={`w-4 h-4 ${isActiveRoute(child.path) ? 'text-yellow-600' : 'text-slate-400'}`} />
                                <span className="text-sm">{child.name}</span>
                              </div>
                              {child.badge && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
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
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActiveRoute(item.path)
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-slate-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActiveRoute(item.path) ? 'text-purple-600' : 'text-slate-400'}`} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
