import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Shield, 
  UserCog, 
  Briefcase, 
  ClipboardList, 
  Calendar, 
  Vote, 
  AlertTriangle, 
  Clock, 
  Activity, 
  Bell, 
  CheckCircle, 
  XCircle, 
  BarChart3, 
  Wifi, 
  WifiOff,
  UserPlus,
  CalendarPlus,
  FileText,
  ChevronRight,
  Zap,
  LogIn,
  LogOut,
  UserCheck,
  RefreshCw,
  MapPin,
  Building2,
  AlertOctagon,
  MessageSquare,
  Megaphone,
  CreditCard,
  Eye,
  Settings,
  Globe,
  ShieldCheck,
  Map,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  BadgeCheck,
  Video,
  Lock,
  Printer,
  Fingerprint,
  Crown,
  DollarSign,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api, getImageUrl } from '../../lib/api';
import NotificationCard from '../../components/director/NotificationCard';

// Types
interface ActivityItem {
  id: string;
  type: string;
  action: string;
  user: string;
  role: string;
  userPhoto: string | null;
  time: string;
  timestamp: string;
  status: string;
  entityType: string | null;
  entityId: string | null;
  metadata: any;
}

interface DashboardStats {
  totalPersonnel: number;
  guardsOnDuty: number;
  activeManagers: number;
  generalSupervisors: number;
  supervisors: number;
  operators: number;
  secretaries: number;
  attendance: { present: number; absent: number; late: number };
  meetingsToday: number;
  activePolls: number;
  pendingApprovals: number;
  activeIncidents: number;
  totalLocations: number;
  understaffedLocations: number;
  monthlyExpenses: number;
  unreadMessages: number;
  moneyIn: number;
  moneyOut: number;
}

interface LocationStatus {
  id: string;
  name: string;
  region: string;
  status: 'green' | 'yellow' | 'red';
  operators: number;
  required: number;
  supervisor: string;
}

interface TopSupervisor {
  id: string;
  name: string;
  photo: string | null;
  rating: number;
  region: string;
  operatorsManaged: number;
}

interface OnDutyPerson {
  _id: string;
  operatorId: {
    _id: string;
    employeeId: string;
    userId: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      phoneNumber?: string;
      profilePhoto?: string;
      passportPhoto?: string;
      status: string;
    };
  };
  supervisorId?: {
    _id: string;
    userId: {
      firstName: string;
      lastName: string;
    };
  };
  bitId?: {
    _id: string;
    bitName: string;
    bitCode: string;
  };
  locationId?: {
    _id: string;
    locationName: string;
    address: string;
    city: string;
    state: string;
  };
  shiftType: string;
  status: string;
  startDate: string;
}

export default function DirectorDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [systemStatus] = useState<'online' | 'offline'>('online');
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalPersonnel: 0,
    guardsOnDuty: 0,
    activeManagers: 0,
    generalSupervisors: 0,
    supervisors: 0,
    operators: 0,
    secretaries: 0,
    attendance: { present: 0, absent: 0, late: 0 },
    meetingsToday: 0,
    activePolls: 0,
    pendingApprovals: 0,
    activeIncidents: 0,
    totalLocations: 0,
    understaffedLocations: 0,
    monthlyExpenses: 0,
    unreadMessages: 0,
    moneyIn: 0,
    moneyOut: 0,
  });
  const [locations, setLocations] = useState<LocationStatus[]>([]);
  const [topSupervisors, setTopSupervisors] = useState<TopSupervisor[]>([]);
  const [onDutyPersonnel, setOnDutyPersonnel] = useState<OnDutyPerson[]>([]);
  const [alerts, setAlerts] = useState<{ id: number; type: string; message: string; urgent: boolean }[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard stats from API
  const fetchDashboardStats = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      const response = await api.get('/director/dashboard/stats');
      const data = response.data;
      
      console.log('📊 Dashboard Stats Loaded (Real-time):', {
        timestamp: new Date().toLocaleTimeString(),
        totalPersonnel: data.stats.totalPersonnel,
        onlineStaff: data.stats.attendance.present,
        pendingApprovals: data.stats.pendingApprovals,
        locations: data.stats.totalLocations,
        incidents: data.stats.activeIncidents,
      });
      
      setStats(data.stats);
      setLocations(data.locations || []);
      setTopSupervisors(data.topSupervisors || []);
      setOnDutyPersonnel(data.onDutyPersonnel || []);
      setAlerts(data.alerts || []);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('❌ Failed to fetch dashboard stats:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch recent activities
  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      setActivitiesError(null);
      const response = await api.get('/activities/recent');
      setRecentActivities(response.data.activities || []);
    } catch (error: any) {
      console.error('Failed to fetch activities:', error);
      setActivitiesError('Failed to load activities');
      setRecentActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchActivities();
    // Auto-refresh: Stats every 30 seconds, Activities every 20 seconds for real-time updates
    const statsInterval = setInterval(() => fetchDashboardStats(true), 30000);
    const activitiesInterval = setInterval(fetchActivities, 20000);
    return () => {
      clearInterval(statsInterval);
      clearInterval(activitiesInterval);
    };
  }, []);

  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return currentTime.toLocaleDateString('en-US', options);
  };

  const getCurrentTimeString = () => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 pb-20 lg:pb-8">
      {/* Command Center Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 px-4 py-5 sm:py-6 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 sm:w-40 h-32 sm:h-40 bg-yellow-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-48 sm:w-60 h-48 sm:h-60 bg-blue-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col gap-4">
            {/* Title Section */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-yellow-400 text-xs sm:text-sm font-semibold tracking-wider uppercase">Managing Director</p>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                      {getGreeting()}, {user?.firstName || 'Director'}! 👋
                    </h1>
                  </div>
                </div>
                <button
                  onClick={() => fetchDashboardStats(true)}
                  disabled={isRefreshing}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/20 text-white text-xs transition-all disabled:opacity-50"
                  title="Refresh data"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-blue-200 text-xs sm:text-sm flex items-center gap-2">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  {getCurrentDate()} • {getCurrentTimeString()}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-green-300">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Live</span>
                  </div>
                  <span className="text-blue-200 text-xs hidden sm:inline">
                    Updated {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Quick Stats Pills - Scrollable on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-hide">
              <div className="bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl border border-white/20 flex-shrink-0">
                <p className="text-white/70 text-[10px] sm:text-xs">Online Staff</p>
                <p className="text-white font-bold text-base sm:text-lg">{stats.attendance.present}</p>
              </div>
              <div className="bg-yellow-500/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl border border-yellow-400/30 flex-shrink-0">
                <p className="text-yellow-200 text-[10px] sm:text-xs">Pending</p>
                <p className="text-yellow-400 font-bold text-base sm:text-lg">{stats.pendingApprovals}</p>
              </div>
              <div className="bg-red-500/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl border border-red-400/30 flex-shrink-0">
                <p className="text-red-200 text-[10px] sm:text-xs">Incidents</p>
                <p className="text-red-400 font-bold text-base sm:text-lg">{stats.activeIncidents}</p>
              </div>
              <div className="bg-green-500/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl border border-green-400/30 flex-shrink-0">
                <p className="text-green-200 text-[10px] sm:text-xs">Locations</p>
                <p className="text-green-400 font-bold text-base sm:text-lg">{stats.totalLocations}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* Urgent Alerts with Marquee */}
        {alerts.filter(a => a.urgent).length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertOctagon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-red-800 text-sm sm:text-base">Urgent Alerts</h3>
                  <button 
                    onClick={() => navigate('/director/notifications')}
                    className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium flex-shrink-0 hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="relative overflow-hidden">
                  <div className="animate-marquee whitespace-nowrap inline-block">
                    {alerts.filter(a => a.urgent).map((alert, index) => (
                      <span key={`${alert.id}-1`} className="inline-flex items-start gap-2 mr-8 text-xs sm:text-sm text-red-700">
                        <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 mt-1.5 ${alert.type === 'critical' ? 'bg-red-500 animate-ping' : 'bg-orange-500'}`}></span>
                        <span>{alert.message}</span>
                      </span>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {alerts.filter(a => a.urgent).map((alert, index) => (
                      <span key={`${alert.id}-2`} className="inline-flex items-start gap-2 mr-8 text-xs sm:text-sm text-red-700">
                        <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 mt-1.5 ${alert.type === 'critical' ? 'bg-red-500 animate-ping' : 'bg-orange-500'}`}></span>
                        <span>{alert.message}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Grid - Mobile First */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
          <MetricCard
            icon={Users}
            label="Total Staff"
            value={stats.totalPersonnel}
            trend={+5.2}
            color="blue"
            onClick={() => navigate('/director/personnel/all')}
          />
          <MetricCard
            icon={Shield}
            label="On Duty"
            value={stats.guardsOnDuty}
            trend={+2.1}
            color="green"
            onClick={() => navigate('/director/attendance')}
          />
          <MetricCard
            icon={MapPin}
            label="Locations"
            value={stats.totalLocations}
            subtext={`${stats.understaffedLocations} need attention`}
            color="yellow"
            onClick={() => navigate('/director/locations')}
          />
          <MetricCard
            icon={AlertTriangle}
            label="Incidents"
            value={stats.activeIncidents}
            color="red"
            onClick={() => navigate('/director/incidents')}
          />
          <MetricCard
            icon={Vote}
            label="Active Polls"
            value={stats.activePolls}
            color="purple"
            onClick={() => navigate('/director/polls/active')}
          />
          <MetricCard
            icon={Calendar}
            label="Meetings"
            value={stats.meetingsToday}
            subtext="Today"
            color="indigo"
            onClick={() => navigate('/director/meetings/list')}
          />
        </div>

        {/* Quick Actions - Essential MD Functions */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
            <QuickAction icon={UserPlus} label="Add Manager" color="blue" onClick={() => navigate('/director/personnel/register-manager')} />
            <QuickAction icon={BadgeCheck} label="Approvals" badge={stats.pendingApprovals} color="yellow" onClick={() => navigate('/director/personnel/pending-approvals')} />
            <QuickAction icon={CalendarPlus} label="Meeting" color="green" onClick={() => navigate('/director/meetings/create')} />
            <QuickAction icon={Megaphone} label="Broadcast" color="red" onClick={() => navigate('/director/communications/broadcast')} />
            <QuickAction icon={Building2} label="Location" color="purple" onClick={() => navigate('/director/locations')} />
            <QuickAction icon={CreditCard} label="Expenses" color="indigo" onClick={() => navigate('/director/transactions/expenses')} />
            <QuickAction icon={DollarSign} label="BIT Expenses" color="cyan" onClick={() => navigate('/director/bit-expenses')} />
            <QuickAction icon={Fingerprint} label="ID Cards" color="teal" onClick={() => navigate('/director/id-cards')} />
            <QuickAction icon={Settings} label="Settings" color="gray" onClick={() => navigate('/director/settings')} />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Left Column - 2/3 width on desktop */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* Staff Overview */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  Staff Overview
                </h2>
                <button 
                  onClick={() => navigate('/director/personnel/all')}
                  className="text-blue-500 text-xs sm:text-sm font-medium hover:text-blue-600 flex items-center gap-1"
                >
                  Manage <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                <StaffCard icon={UserCog} label="Managers" count={stats.activeManagers} color="blue" />
                <StaffCard icon={Crown} label="Gen. Sup." count={stats.generalSupervisors} color="yellow" />
                <StaffCard icon={Shield} label="Supervisors" count={stats.supervisors} color="green" />
                <StaffCard icon={Users} label="Operators" count={stats.operators} color="purple" />
                <StaffCard icon={Briefcase} label="Secretaries" count={stats.secretaries} color="indigo" />
              </div>
            </div>

            {/* Location Status Map */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Map className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  Location Status
                </h2>
                <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500"></span> Optimal</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-500"></span> Warning</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500"></span> Critical</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {locations.length > 0 ? (
                  locations.map(location => (
                    <LocationCard key={location.id} location={location} />
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No locations found</p>
                )}
              </div>
              
              <button 
                onClick={() => navigate('/director/locations')}
                className="mt-3 sm:mt-4 w-full py-2 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                View All {stats.totalLocations} Locations
              </button>
            </div>

            {/* Today's Attendance */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  Today's Attendance
                </h2>
                <button 
                  onClick={() => navigate('/director/attendance')}
                  className="text-blue-500 text-xs sm:text-sm font-medium hover:text-blue-600 flex items-center gap-1"
                >
                  Full Report <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                <div className="bg-green-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                  <p className="text-xl sm:text-3xl font-bold text-green-600">{stats.attendance.present}</p>
                  <p className="text-[10px] sm:text-sm text-green-700">Present</p>
                </div>
                <div className="bg-red-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                  <p className="text-xl sm:text-3xl font-bold text-red-600">{stats.attendance.absent}</p>
                  <p className="text-[10px] sm:text-sm text-red-700">Absent</p>
                </div>
                <div className="bg-yellow-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                  <p className="text-xl sm:text-3xl font-bold text-yellow-600">{stats.attendance.late}</p>
                  <p className="text-[10px] sm:text-sm text-yellow-700">Late</p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="relative h-2 sm:h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="absolute left-0 top-0 h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.attendance.present / stats.totalPersonnel) * 100}%` }}
                ></div>
                <div 
                  className="absolute top-0 h-full bg-yellow-500 rounded-full transition-all duration-500"
                  style={{ 
                    left: `${(stats.attendance.present / stats.totalPersonnel) * 100}%`,
                    width: `${(stats.attendance.late / stats.totalPersonnel) * 100}%` 
                  }}
                ></div>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-2 text-center">
                {Math.round((stats.attendance.present / stats.totalPersonnel) * 100)}% attendance rate
              </p>
            </div>

            {/* On Duty Personnel */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  On Duty Now
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    {onDutyPersonnel.length}
                  </span>
                </h2>
                <button 
                  onClick={() => navigate('/director/operators/list')}
                  className="text-blue-500 text-xs sm:text-sm font-medium hover:text-blue-600 flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
              
              {onDutyPersonnel.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs sm:text-sm">No personnel on duty</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {onDutyPersonnel.slice(0, 10).map(assignment => {
                    const operator = assignment.operatorId;
                    const user = operator?.userId;
                    if (!operator || !user) return null;
                    
                    const profilePhoto = user.profilePhoto || user.passportPhoto;
                    const operatorName = `${user.firstName} ${user.lastName}`;
                    const supervisor = assignment.supervisorId?.userId;
                    const supervisorName = supervisor ? `${supervisor.firstName} ${supervisor.lastName}` : 'N/A';
                    
                    return (
                      <div 
                        key={assignment._id} 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                      >
                        <div className="relative">
                          {profilePhoto ? (
                            <img
                              src={getImageUrl(profilePhoto)}
                              alt={operatorName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-green-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) {
                                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div className={`w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm border-2 border-green-200 ${profilePhoto ? 'hidden' : ''}`}>
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{operatorName}</p>
                          <p className="text-xs text-gray-500">ID: {operator.employeeId}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {assignment.shiftType && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                assignment.shiftType === 'DAY' ? 'bg-yellow-100 text-yellow-800' :
                                assignment.shiftType === 'NIGHT' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {assignment.shiftType}
                              </span>
                            )}
                            {assignment.bitId && (
                              <span className="text-[10px] text-gray-600 truncate">
                                @ {assignment.bitId.bitName}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {assignment.locationId && (
                            <p className="text-xs font-medium text-gray-700 truncate max-w-24">
                              {assignment.locationId.locationName}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-500">
                            Sup: {supervisorName}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {onDutyPersonnel.length > 10 && (
                <button 
                  onClick={() => navigate('/director/operators/list')}
                  className="mt-3 w-full py-2 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  View All {onDutyPersonnel.length} Personnel
                </button>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  Recent Activity
                  {activitiesLoading && <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 animate-spin" />}
                </h2>
                <button 
                  onClick={() => navigate('/director/activity')}
                  className="text-blue-500 text-xs sm:text-sm font-medium hover:text-blue-600 flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
              
              {activitiesError ? (
                <div className="text-center py-6 sm:py-8">
                  <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs sm:text-sm">{activitiesError}</p>
                  <button onClick={fetchActivities} className="mt-2 text-blue-500 text-xs sm:text-sm hover:underline">
                    Try Again
                  </button>
                </div>
              ) : activitiesLoading && recentActivities.length === 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2 sm:p-3 rounded-xl animate-pulse">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full" />
                      <div className="flex-1">
                        <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-2 sm:h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs sm:text-sm">No recent activities</p>
                </div>
              ) : (
                <div className="space-y-1 sm:space-y-2">
                  {recentActivities.slice(0, 6).map(activity => (
                    <RealActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - 1/3 width on desktop */}
          <div className="space-y-4 sm:space-y-6">
            
            {/* Notifications */}
            <NotificationCard />

            {/* Top Performing Supervisors */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                  Top Supervisors
                </h2>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                {topSupervisors.length > 0 ? (
                  topSupervisors.map((sup, index) => (
                    <div key={sup.id} className="flex items-center gap-2 sm:gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                      <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-orange-300 text-orange-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-[10px] sm:text-sm">
                        {sup.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-xs sm:text-sm truncate">{sup.name}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">{sup.region} • {sup.operatorsManaged} ops</p>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] sm:text-sm font-medium">{sup.rating}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No supervisors found</p>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 text-white">
              <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                This Month
              </h2>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <p className="text-blue-200 text-[10px] sm:text-sm">Grand Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-400">{formatCurrency(stats.moneyIn - stats.moneyOut)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3">
                    <p className="text-[10px] sm:text-xs text-blue-200">Money In</p>
                    <p className="font-bold text-sm sm:text-base text-green-400">{formatCurrency(stats.moneyIn)}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3">
                    <p className="text-[10px] sm:text-xs text-blue-200">Money Out</p>
                    <p className="font-bold text-sm sm:text-base text-red-400">{formatCurrency(stats.moneyOut)}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate('/director/financial-overview')}
                  className="w-full py-2 bg-yellow-400 text-yellow-900 rounded-lg font-medium hover:bg-yellow-300 transition-colors text-xs sm:text-sm"
                >
                  Financial Overview
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                System Status
              </h2>
              
              <div className="space-y-2 sm:space-y-3">
                <StatusItem label="Server Status" status="operational" />
                <StatusItem label="Database" status="operational" />
                <StatusItem label="SMS Gateway" status="warning" />
                <StatusItem label="Email Service" status="operational" />
              </div>
              
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {systemStatus === 'online' ? (
                    <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  )}
                  <span className="text-[10px] sm:text-sm text-slate-600">
                    {systemStatus === 'online' ? 'All Systems Online' : 'Connection Issues'}
                  </span>
                </div>
                <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                  systemStatus === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {systemStatus === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                Quick Links
              </h2>
              
              <div className="grid grid-cols-2 gap-2">
                <QuickLink icon={BarChart3} label="Reports" onClick={() => navigate('/director/reports')} />
                <QuickLink icon={Video} label="Meetings" onClick={() => navigate('/director/meetings/list')} />
                <QuickLink icon={MessageSquare} label="Messages" onClick={() => navigate('/director/communications/messages')} />
                <QuickLink icon={Lock} label="Security" onClick={() => navigate('/director/settings/security')} />
                <QuickLink icon={Printer} label="Print ID" onClick={() => navigate('/director/id-cards/print')} />
                <QuickLink icon={Eye} label="Audit Logs" onClick={() => navigate('/director/audit-logs')} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add marquee animation styles */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

// Component: Metric Card
function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  subtext,
  color, 
  onClick 
}: { 
  icon: any; 
  label: string; 
  value: number | string;
  trend?: number;
  subtext?: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  onClick?: () => void;
}) {
  const colorStyles = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-400 to-yellow-500',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  return (
    <button 
      onClick={onClick}
      className="bg-white rounded-xl sm:rounded-2xl shadow-md p-3 sm:p-4 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-left w-full group active:scale-95"
    >
      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${colorStyles[color]} flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </div>
      <p className="text-lg sm:text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">{label}</p>
      {trend !== undefined && (
        <div className={`flex items-center gap-0.5 sm:gap-1 mt-1 sm:mt-2 text-[10px] sm:text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <ArrowDownRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
          {Math.abs(trend)}%
        </div>
      )}
      {subtext && <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">{subtext}</p>}
    </button>
  );
}

// Component: Quick Action
function QuickAction({ 
  icon: Icon, 
  label, 
  badge,
  color,
  onClick 
}: { 
  icon: any; 
  label: string;
  badge?: number;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo' | 'teal' | 'gray';
  onClick?: () => void;
}) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 active:bg-blue-200',
    green: 'bg-green-50 text-green-600 hover:bg-green-100 active:bg-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100 active:bg-yellow-200',
    red: 'bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100 active:bg-purple-200',
    indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 active:bg-indigo-200',
    teal: 'bg-teal-50 text-teal-600 hover:bg-teal-100 active:bg-teal-200',
    gray: 'bg-gray-50 text-gray-600 hover:bg-gray-100 active:bg-gray-200',
  };

  return (
    <button 
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg sm:rounded-xl ${colorStyles[color]} transition-all duration-200 active:scale-95`}
    >
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="text-[10px] sm:text-xs font-medium text-center leading-tight line-clamp-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center font-bold">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

// Component: Staff Card
function StaffCard({ 
  icon: Icon, 
  label, 
  count, 
  color 
}: { 
  icon: any; 
  label: string; 
  count: number; 
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'indigo';
}) {
  const colorStyles = {
    blue: 'bg-blue-50 border-blue-100 text-blue-600',
    green: 'bg-green-50 border-green-100 text-green-600',
    yellow: 'bg-yellow-50 border-yellow-100 text-yellow-600',
    purple: 'bg-purple-50 border-purple-100 text-purple-600',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
  };

  return (
    <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border ${colorStyles[color]} text-center transition-all hover:shadow-md cursor-pointer active:scale-95`}>
      <Icon className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-0.5 sm:mb-1" />
      <p className="text-base sm:text-xl font-bold text-slate-900">{count}</p>
      <p className="text-[10px] sm:text-xs truncate">{label}</p>
    </div>
  );
}

// Component: Location Card
function LocationCard({ location }: { location: LocationStatus }) {
  const statusStyles = {
    green: 'bg-green-50 border-green-200 hover:bg-green-100',
    yellow: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    red: 'bg-red-50 border-red-200 hover:bg-red-100',
  };

  const dotStyles = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl border ${statusStyles[location.status]} transition-all cursor-pointer active:scale-[0.98]`}>
      <span className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${dotStyles[location.status]} flex-shrink-0`}></span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 text-xs sm:text-sm truncate">{location.name}</p>
        <p className="text-[10px] sm:text-xs text-slate-500 truncate">{location.region} • {location.supervisor}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-slate-900 text-xs sm:text-sm">{location.operators}/{location.required}</p>
        <p className="text-[10px] sm:text-xs text-slate-500">operators</p>
      </div>
    </div>
  );
}

// Component: Real Activity Item
function RealActivityItem({ activity }: { activity: ActivityItem }) {
  const getActivityIcon = () => {
    switch (activity.action) {
      case 'LOGIN': return <LogIn className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />;
      case 'LOGOUT': return <LogOut className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />;
      case 'SUPERVISOR_REGISTERED': return <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />;
      case 'SUPERVISOR_APPROVED': return <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />;
      case 'SUPERVISOR_REJECTED': return <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />;
      case 'MANAGER_REGISTERED': return <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />;
      case 'EXPENSE_SUBMITTED': return <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />;
      case 'EXPENSE_APPROVED': return <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />;
      case 'MEETING_CREATED': return <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />;
      case 'ATTENDANCE_CHECKED_IN': return <ClipboardList className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />;
      case 'INCIDENT_REPORTED': return <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />;
      default: return <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'LOGIN': 'Logged in',
      'LOGOUT': 'Logged out',
      'SUPERVISOR_REGISTERED': 'Supervisor registered',
      'SUPERVISOR_APPROVED': 'Supervisor approved',
      'SUPERVISOR_REJECTED': 'Supervisor rejected',
      'MANAGER_REGISTERED': 'Manager registered',
      'EXPENSE_SUBMITTED': 'Expense submitted',
      'EXPENSE_APPROVED': 'Expense approved',
      'MEETING_CREATED': 'Meeting created',
      'ATTENDANCE_CHECKED_IN': 'Checked in',
      'INCIDENT_REPORTED': 'Incident reported',
    };
    return labels[action] || action.replace(/_/g, ' ').toLowerCase();
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors active:bg-gray-100">
      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
        {getActivityIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">{activity.user}</p>
        <p className="text-[10px] sm:text-xs text-slate-500 truncate">{getActionLabel(activity.action)}</p>
      </div>
      <p className="text-[10px] sm:text-xs text-slate-400 flex-shrink-0">{activity.time}</p>
    </div>
  );
}

// Component: Status Item
function StatusItem({ label, status }: { label: string; status: 'operational' | 'warning' | 'error' }) {
  const statusStyles = {
    operational: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'OK' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Warning' },
    error: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Error' },
  };

  const style = statusStyles[status];

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs sm:text-sm text-slate-600">{label}</span>
      <span className={`flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${style.bg} ${style.text}`}>
        <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${style.dot}`}></span>
        {style.label}
      </span>
    </div>
  );
}

// Component: Quick Link
function QuickLink({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors text-xs sm:text-sm text-slate-700 font-medium"
    >
      <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
      {label}
    </button>
  );
}
