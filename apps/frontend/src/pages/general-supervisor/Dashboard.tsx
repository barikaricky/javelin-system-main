import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  MapPin,
  ClipboardCheck,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
  Building2,
  CheckCircle,
  ArrowUpRight,
  MessageSquare,
  Zap,
  RefreshCw,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api, getImageUrl } from '../../lib/api';
import toast from 'react-hot-toast';

// Types
interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: any;
  trend?: { value: number; isPositive: boolean };
  color: 'purple' | 'blue' | 'green' | 'yellow' | 'red' | 'indigo';
  linkTo?: string;
}

interface Supervisor {
  id: string;
  name: string;
  photo?: string;
  locationsCount: number;
  operatorsCount: number;
  status: 'active' | 'on-leave' | 'offline';
  lastActivity: string;
  performance: number;
}

interface Incident {
  id: string;
  title: string;
  location: string;
  reportedBy: string;
  severity: 'high' | 'medium' | 'low';
  time: string;
  status: 'open' | 'investigating' | 'resolved';
}

interface LocationStatus {
  id: string;
  name: string;
  supervisor: string;
  operatorsAssigned: number;
  operatorsPresent: number;
  status: 'green' | 'yellow' | 'red';
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
      profilePhoto?: string;
      passportPhoto?: string;
    };
  };
  locationId?: {
    _id: string;
    locationName: string;
  };
  bitId?: {
    _id: string;
    bitName: string;
  };
  shiftType: string;
  status: string;
}

// Stats Card Component
function StatsCard({ title, value, subtitle, icon: Icon, trend, color, linkTo }: StatsCardProps) {
  const colorStyles = {
    purple: 'bg-purple-500 shadow-purple-200',
    blue: 'bg-blue-500 shadow-blue-200',
    green: 'bg-green-500 shadow-green-200',
    yellow: 'bg-yellow-500 shadow-yellow-200',
    red: 'bg-red-500 shadow-red-200',
    indigo: 'bg-indigo-500 shadow-indigo-200',
  };

  const content = (
    <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl ${colorStyles[color]} shadow-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-600 mt-1">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {linkTo && (
        <div className="mt-3 flex items-center text-purple-600 text-sm font-medium">
          View Details <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      )}
    </div>
  );

  return linkTo ? <Link to={linkTo}>{content}</Link> : content;
}

// Supervisor Card Component
function SupervisorCard({ supervisor }: { supervisor: Supervisor }) {
  const statusColors = {
    active: 'bg-green-100 text-green-700',
    'on-leave': 'bg-yellow-100 text-yellow-700',
    offline: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
        {supervisor.photo ? (
          <img src={supervisor.photo} alt={supervisor.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-purple-600 font-semibold">
            {supervisor.name.split(' ').map(n => n[0]).join('')}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 truncate">{supervisor.name}</p>
        <p className="text-sm text-slate-500">
          {supervisor.locationsCount} locations • {supervisor.operatorsCount} operators
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[supervisor.status]}`}>
          {supervisor.status}
        </span>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-green-500" />
          <span className="text-xs text-slate-500">{supervisor.performance}%</span>
        </div>
      </div>
    </div>
  );
}

// Incident Card Component
function IncidentCard({ incident }: { incident: Incident }) {
  const severityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const statusIcons = {
    open: <AlertTriangle className="w-4 h-4 text-red-500" />,
    investigating: <Clock className="w-4 h-4 text-yellow-500" />,
    resolved: <CheckCircle className="w-4 h-4 text-green-500" />,
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
      <div className={`p-2 rounded-lg ${severityColors[incident.severity]}`}>
        <AlertTriangle className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate">{incident.title}</p>
        <p className="text-sm text-slate-500">{incident.location} • {incident.reportedBy}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        {statusIcons[incident.status]}
        <p className="text-xs text-slate-400">{incident.time}</p>
      </div>
    </div>
  );
}

// Location Status Component
function LocationStatusCard({ location }: { location: LocationStatus }) {
  const statusColors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  const percentage = Math.round((location.operatorsPresent / location.operatorsAssigned) * 100);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
      <div className={`w-3 h-3 rounded-full ${statusColors[location.status]}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate">{location.name}</p>
        <p className="text-xs text-slate-500">{location.supervisor}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-slate-900">
          {location.operatorsPresent}/{location.operatorsAssigned}
        </p>
        <p className={`text-xs ${percentage >= 80 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
          {percentage}% staffed
        </p>
      </div>
    </div>
  );
}

export default function GSDashboard() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [onDutyPersonnel, setOnDutyPersonnel] = useState<OnDutyPerson[]>([]);

  // Real data from API
  const [stats, setStats] = useState({
    supervisorsUnderMe: 0,
    totalOperators: 0,
    activeBits: 0,
    todayAttendance: 0,
    attendanceRate: 0,
    openIncidents: 0,
    pendingIssues: 0,
    locationsUnderMe: 0,
  });

  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [locationStatuses, setLocationStatuses] = useState<LocationStatus[]>([]);

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('📊 Fetching dashboard data...');
      
      const response = await api.get('/general-supervisor/dashboard');
      console.log('✅ Dashboard data received:', response.data);
      
      if (response.data.stats) {
        console.log('📈 Stats:', response.data.stats);
        setStats(response.data.stats);
      }
      if (response.data.supervisors) {
        console.log('👥 Supervisors:', response.data.supervisors.length);
        setSupervisors(response.data.supervisors);
      }
      if (response.data.incidents) {
        console.log('⚠️ Incidents:', response.data.incidents.length);
        setRecentIncidents(response.data.incidents);
      }
      if (response.data.locations) {
        console.log('📍 Locations:', response.data.locations.length);
        setLocationStatuses(response.data.locations);
      }
      if (response.data.onDutyPersonnel) {
        console.log('🛡️ On Duty Personnel:', response.data.onDutyPersonnel.length);
        setOnDutyPersonnel(response.data.onDutyPersonnel);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch dashboard data:', error);
      console.error('📋 Error details:', error.response?.data);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const dataInterval = setInterval(fetchDashboardData, 60000); // Refresh every minute
    return () => clearInterval(dataInterval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {getGreeting()}, {user?.firstName || 'General Supervisor'}! 👋
          </h1>
          <p className="text-purple-200 mt-1 text-sm sm:text-base">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-white/80 mt-2 text-sm">
            Here's an overview of your team and locations
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Supervisors Under Me"
            value={stats.supervisorsUnderMe}
            subtitle="Active team members"
            icon={Users}
            color="purple"
            linkTo="/general-supervisor/supervisors"
            trend={{ value: 0, isPositive: true }}
          />
          <StatsCard
            title="Total Operators"
            value={stats.totalOperators}
            subtitle="Under supervision"
            icon={UserCheck}
            color="blue"
            linkTo="/general-supervisor/operators"
          />
          <StatsCard
            title="Active Bits"
            value={stats.activeBits}
            subtitle="Locations monitored"
            icon={MapPin}
            color="green"
            linkTo="/general-supervisor/locations"
          />
          <StatsCard
            title="Today's Attendance"
            value={`${stats.attendanceRate}%`}
            subtitle={`${stats.todayAttendance} present`}
            icon={ClipboardCheck}
            color="yellow"
            linkTo="/general-supervisor/attendance/operators"
            trend={{ value: 2, isPositive: true }}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="On Duty"
            value={onDutyPersonnel.length}
            subtitle="Currently active"
            icon={ShieldCheck}
            color="purple"
            linkTo="/general-supervisor/attendance"
          />
          <StatsCard
            title="Open Incidents"
            value={stats.openIncidents}
            subtitle="Requires attention"
            icon={AlertTriangle}
            color="red"
            linkTo="/general-supervisor/incidents"
          />
          <StatsCard
            title="Pending Issues"
            value={stats.pendingIssues}
            subtitle="Awaiting resolution"
            icon={Clock}
            color="indigo"
            linkTo="/general-supervisor/incidents"
          />
          <StatsCard
            title="My Locations"
            value={stats.locationsUnderMe}
            subtitle="Under my region"
            icon={Building2}
            color="purple"
            linkTo="/general-supervisor/locations"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/general-supervisor/supervisors"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-all duration-300 hover:shadow-lg"
            >
              <Users className="w-6 h-6" />
              <span className="text-sm font-medium text-center">View Supervisors</span>
            </Link>
            <Link
              to="/general-supervisor/incidents"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all duration-300 hover:shadow-lg"
            >
              <AlertTriangle className="w-6 h-6" />
              <span className="text-sm font-medium text-center">View Incidents</span>
            </Link>
            <Link
              to="/general-supervisor/attendance/operators"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-all duration-300 hover:shadow-lg"
            >
              <ClipboardCheck className="w-6 h-6" />
              <span className="text-sm font-medium text-center">Check Attendance</span>
            </Link>
            <Link
              to="/general-supervisor/communication/send"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 hover:shadow-lg"
            >
              <MessageSquare className="w-6 h-6" />
              <span className="text-sm font-medium text-center">Message Team</span>
            </Link>
          </div>
        </div>

        {/* On Duty Personnel Section */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-500" />
              On Duty Personnel
              {onDutyPersonnel.length > 0 && (
                <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                  {onDutyPersonnel.length} Active
                </span>
              )}
            </h2>
            <Link 
              to="/general-supervisor/attendance"
              className="text-purple-600 text-sm font-medium hover:text-purple-700 flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {onDutyPersonnel.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No operators currently on duty</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                {onDutyPersonnel.slice(0, 10).map((person) => {
                  const operator = person.operatorId;
                  const user = operator?.userId;
                  if (!operator || !user) return null;

                  const profilePhoto = user.profilePhoto || user.passportPhoto;
                  const operatorName = `${user.firstName} ${user.lastName}`;

                  return (
                    <div 
                      key={person._id} 
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 hover:shadow-md transition-all"
                    >
                      <div className="relative">
                        {profilePhoto ? (
                          <img
                            src={getImageUrl(profilePhoto)}
                            alt={operatorName}
                            className="w-14 h-14 rounded-full object-cover border-2 border-purple-200"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-purple-200 ${profilePhoto ? 'hidden' : ''}`}>
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 border-2 border-white rounded-full animate-pulse"></div>
                      </div>
                      <div className="text-center w-full">
                        <p className="text-xs font-semibold text-slate-900 truncate">{operatorName}</p>
                        <p className="text-[10px] text-slate-500 truncate">{person.locationId?.locationName || 'No Location'}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                          person.shiftType === 'DAY' ? 'bg-yellow-100 text-yellow-700' :
                          person.shiftType === 'NIGHT' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {person.shiftType}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {onDutyPersonnel.length > 10 && (
                <Link
                  to="/general-supervisor/attendance"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all font-medium shadow-md"
                >
                  <Shield className="w-4 h-4" />
                  View All {onDutyPersonnel.length} On-Duty Personnel
                </Link>
              )}
            </>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supervisors Under Me */}
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                My Supervisors
              </h2>
              <Link 
                to="/general-supervisor/supervisors"
                className="text-purple-600 text-sm font-medium hover:text-purple-700 flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {supervisors.slice(0, 4).map(supervisor => (
                <SupervisorCard key={supervisor.id} supervisor={supervisor} />
              ))}
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Recent Incidents
                {stats.openIncidents > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {stats.openIncidents}
                  </span>
                )}
              </h2>
              <Link 
                to="/general-supervisor/incidents"
                className="text-purple-600 text-sm font-medium hover:text-purple-700 flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentIncidents.map(incident => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </div>
            {stats.openIncidents > 0 && (
              <Link
                to="/general-supervisor/incidents/escalate"
                className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                <ArrowUpRight className="w-4 h-4" />
                Escalate to Manager
              </Link>
            )}
          </div>
        </div>

        {/* Location Status */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-500" />
              Location Status
            </h2>
            <Link 
              to="/general-supervisor/locations/status"
              className="text-purple-600 text-sm font-medium hover:text-purple-700 flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {/* Status Legend */}
          <div className="flex gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-slate-600">Fully Staffed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-slate-600">Understaffed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-600">Critical</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {locationStatuses.map(location => (
              <LocationStatusCard key={location.id} location={location} />
            ))}
          </div>

          {/* Understaffed Alert */}
          {locationStatuses.filter(l => l.status === 'red').length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {locationStatuses.filter(l => l.status === 'red').length} location(s) critically understaffed
                </span>
              </div>
              <Link
                to="/general-supervisor/locations/understaffed"
                className="mt-2 text-red-600 text-sm hover:underline flex items-center gap-1"
              >
                View and take action <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Today's Activity Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            Today's Activity Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-purple-600">24</p>
              <p className="text-sm text-slate-600">Supervisor Visits</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">89</p>
              <p className="text-sm text-slate-600">Operator Check-ins</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">12</p>
              <p className="text-sm text-slate-600">Reports Submitted</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-yellow-600">3</p>
              <p className="text-sm text-slate-600">Incidents Resolved</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
