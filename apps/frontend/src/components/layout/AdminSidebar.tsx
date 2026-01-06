import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  Mail,
  FileText,
  UserCircle,
  Lock,
  LogOut,
  Menu,
  X,
  Eye,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api, getImageUrl } from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['operations', 'account']);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const { clearAuth, user } = useAuthStore();
  const navigate = useNavigate();

  // Fetch profile photo
  useEffect(() => {
    const fetchProfilePhoto = async () => {
      try {
        const userResponse = await api.get('/users/profile');
        const userData = userResponse.data.user || userResponse.data;
        
        const adminResponse = await api.get('/admins/my-profile');
        const adminData = adminResponse.data.admin || adminResponse.data;
        
        const photo = userData?.profilePhoto || 
                     userData?.passportPhoto || 
                     adminData?.passportPhotoUrl || 
                     (adminData?.userId as any)?.profilePhoto ||
                     (adminData?.userId as any)?.passportPhoto ||
                     null;
        
        setProfilePhoto(photo);
      } catch (error) {
        console.error('Error fetching profile photo:', error);
      }
    };

    fetchProfilePhoto();
  }, []);

  const handleLogout = async () => {
    try {
      clearAuth();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const navigation = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin/dashboard',
      badge: null,
    },
    {
      section: 'Operations',
      id: 'operations',
      items: [
        {
          name: 'BITs & Locations',
          icon: Building2,
          path: '/admin/bits',
          description: 'View only',
        },
        {
          name: 'Operators',
          icon: Users,
          path: '/admin/operators',
          description: 'View profiles',
        },
        {
          name: 'Supervisors',
          icon: Shield,
          path: '/admin/supervisors',
          description: 'View assignments',
        },
      ],
    },
    {
      section: 'Communication',
      id: 'communication',
      items: [
        {
          name: 'Messages',
          icon: Mail,
          path: '/admin/messages',
          badge: 0,
        },
      ],
    },
    {
      section: 'Reports',
      id: 'reports',
      items: [
        {
          name: 'Approved Reports',
          icon: FileText,
          path: '/admin/reports',
          description: 'Read only',
        },
      ],
    },
    {
      section: 'Account',
      id: 'account',
      items: [
        {
          name: 'My Profile',
          icon: UserCircle,
          path: '/admin/profile',
        },
        {
          name: 'Security',
          icon: Lock,
          path: '/admin/security',
        },
        {
          name: 'Login History',
          icon: Clock,
          path: '/admin/login-history',
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isCollapsed ? <Menu className="w-6 h-6" /> : <X className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          ${isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-72'}
          fixed lg:static inset-y-0 left-0 z-40
          bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
          border-r border-slate-700
          transition-all duration-300 ease-in-out
          flex flex-col
        `}
      >
        {/* Logo / Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center' : ''}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Eye className="w-6 h-6 text-white" />
              </div>
              {!isCollapsed && (
                <div>
                  <h2 className="font-bold text-white text-lg">Admin Portal</h2>
                  <p className="text-xs text-slate-400">View-Only Access</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              ) : (
                <Menu className="w-5 h-5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-slate-700">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center' : ''}`}>
            {profilePhoto ? (
              <img
                src={getImageUrl(profilePhoto)}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-blue-500"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 ${profilePhoto ? 'hidden' : ''}`}>
              <span className="text-white font-semibold text-sm">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-slate-400 text-xs truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Limited Access Notice */}
        {!isCollapsed && (
          <div className="mx-4 mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-300">Limited Access</p>
                <p className="text-xs text-amber-400/80 mt-0.5">
                  View-only permissions
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navigation.map((item, index) => {
            if ('section' in item) {
              const isExpanded = expandedSections.includes(item.id);
              return (
                <div key={index} className="space-y-1">
                  {!isCollapsed && (
                    <button
                      onClick={() => toggleSection(item.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
                    >
                      <span>{item.section}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  {(isExpanded || isCollapsed) && (
                    <div className="space-y-1">
                      {item.items.map((subItem, subIndex) => (
                        <NavLink
                          key={subIndex}
                          to={subItem.path}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                            } ${isCollapsed ? 'lg:justify-center' : ''}`
                          }
                        >
                          <subItem.icon className="w-5 h-5 flex-shrink-0" />
                          {!isCollapsed && (
                            <>
                              <span className="flex-1 text-sm font-medium">{subItem.name}</span>
                              {subItem.badge !== undefined && subItem.badge > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                  {subItem.badge}
                                </span>
                              )}
                              {subItem.description && (
                                <span className="text-xs text-slate-500 group-hover:text-slate-400">
                                  {subItem.description}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            } else {
              return (
                <NavLink
                  key={index}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    } ${isCollapsed ? 'lg:justify-center' : ''}`
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-sm font-medium">{item.name}</span>
                      {item.badge !== null && item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            }
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all ${
              isCollapsed ? 'lg:justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}
