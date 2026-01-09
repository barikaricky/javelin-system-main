import { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  MapPin,
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Eye,
  ArrowUpRight,
  Calendar,
  Building2,
  Star,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Shield,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, getImageUrl } from '../../lib/api';

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'emerald' | 'blue' | 'amber' | 'purple' | 'red';
  linkTo?: string;
}

function StatsCard({ title, value, subtitle, icon: Icon, trend, color, linkTo }: StatsCardProps) {
  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'bg-emerald-500',
      text: 'text-emerald-600',
      trend: 'text-emerald-600',
    },
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-500',
      text: 'text-blue-600',
      trend: 'text-blue-600',
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'bg-amber-500',
      text: 'text-amber-600',
      trend: 'text-amber-600',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'bg-purple-500',
      text: 'text-purple-600',
      trend: 'text-purple-600',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'bg-red-500',
      text: 'text-red-600',
      trend: 'text-red-600',
    },
  };

  const content = (
    <div className={`${colorClasses[color].bg} rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 group`}>
      <div className="flex items-start justify-between">
        <div className={`${colorClasses[color].icon} w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        {linkTo && (
          <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        )}
      </div>
      <div className="mt-3 sm:mt-4">
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</h3>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 ${trend.isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend.isPositive ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />}
            <span className="text-xs sm:text-sm font-medium">{trend.value}%</span>
            <span className="text-xs text-gray-500">vs last week</span>
          </div>
        )}
      </div>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }

  return content;
}

// Recent Incident Card
interface Incident {
  id: string;
  title: string;
  location: string;
  severity: 'low' | 'medium' | 'high';
  time: string;
  status: 'open' | 'investigating' | 'resolved';
}

function IncidentCard({ incident }: { incident: Incident }) {
  const severityColors = {
    low: 'bg-yellow-100 text-yellow-700',
    medium: 'bg-orange-100 text-orange-700',
    high: 'bg-red-100 text-red-700',
  };

  const statusColors = {
    open: 'bg-red-100 text-red-700',
    investigating: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
  };

  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors">
      <div className={`p-1.5 sm:p-2 rounded-lg ${severityColors[incident.severity]} flex-shrink-0`}>
        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm sm:text-base text-gray-900 truncate">{incident.title}</p>
        <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{incident.location}</span>
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[incident.status]}`}>
          {incident.status}
        </span>
        <p className="text-xs text-gray-500 mt-1">{incident.time}</p>
      </div>
    </div>
  );
}

// Supervisor Card
interface Supervisor {
  id: string;
  name: string;
  location: string;
  operatorsCount: number;
  rating: number;
  status: 'active' | 'inactive';
}

function SupervisorCard({ supervisor }: { supervisor: Supervisor }) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
        {supervisor.name.split(' ').map(n => n[0]).join('')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm sm:text-base text-gray-900 truncate">{supervisor.name}</p>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${supervisor.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
        </div>
        <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{supervisor.location}</span>
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-1 text-amber-500">
          <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
          <span className="text-sm font-medium">{supervisor.rating}</span>
        </div>
        <p className="text-xs text-gray-500">{supervisor.operatorsCount} ops</p>
      </div>
    </div>
  );
}

// Location Status Card
interface Location {
  id: string;
  name: string;
  address: string;
  operatorsAssigned: number;
  operatorsPresent: number;
  status?: 'normal' | 'understaffed' | 'alert';
}

function LocationCard({ location }: { location: Location }) {
  const statusConfig: Record<string, { color: string; label: string }> = {
    normal: { color: 'bg-emerald-100 text-emerald-700', label: 'Normal' },
    understaffed: { color: 'bg-amber-100 text-amber-700', label: 'Understaffed' },
    alert: { color: 'bg-red-100 text-red-700', label: 'Alert' },
  };

  const status = location.status && statusConfig[location.status] ? location.status : 'normal';
  const currentStatus = statusConfig[status];

  const attendance = location.operatorsAssigned > 0 
    ? Math.round((location.operatorsPresent / location.operatorsAssigned) * 100) 
    : 0;

  return (
    <div className="p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm sm:text-base text-gray-900 truncate">{location.name}</h4>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{location.address}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${currentStatus.color} flex-shrink-0`}>
          {currentStatus.label}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <span className="text-gray-600 flex items-center gap-1">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            {location.operatorsPresent}/{location.operatorsAssigned}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 sm:w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${attendance >= 80 ? 'bg-emerald-500' : attendance >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${attendance}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 flex-shrink-0">{attendance}%</span>
        </div>
      </div>
    </div>
  );
}

// On Duty Person Interface
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
  beatId?: {
    _id: string;
    beatName: string;
    beatCode: string;
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

export default function ManagerDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Real data from API
  const [stats, setStats] = useState({
    totalSupervisors: 0,
    totalGeneralSupervisors: 0,
    totalOperators: 0,
    activeLocations: 0,
    todayAttendance: 0,
    attendanceRate: 0,
    openIncidents: 0,
    pendingRequests: 0,
    pendingApprovals: 0,
  });

  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [topSupervisors, setTopSupervisors] = useState<Supervisor[]>([]);
  const [locationStatuses, setLocationStatuses] = useState<Location[]>([]);
  const [onDutyPersonnel, setOnDutyPersonnel] = useState<OnDutyPerson[]>([]);

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/managers/dashboard/stats');
      
      if (response.data) {
        setStats(response.data.stats || stats);
        setRecentIncidents(response.data.incidents || []);
        setTopSupervisors(response.data.supervisors || []);
        setLocationStatuses(response.data.locations || []);
        setOnDutyPersonnel(response.data.onDutyPersonnel || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    fetchDashboardData();
    const dataInterval = setInterval(fetchDashboardData, 60000); // Refresh every minute

    return () => {
      clearInterval(timer);
      clearInterval(dataInterval);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Welcome back, Manager!</h1>
            <p className="text-emerald-100 mt-1 text-xs sm:text-sm">
              Here's your overview for {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-1.5 sm:px-4 sm:py-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-semibold text-sm sm:text-base">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-1.5 sm:px-4 sm:py-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-semibold text-sm sm:text-base">Day Shift</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="On Duty"
          value={onDutyPersonnel.length}
          subtitle="Active personnel"
          icon={ShieldCheck}
          color="emerald"
          linkTo="/manager/attendance"
        />
        <StatsCard
          title="Total Supervisors"
          value={stats.totalSupervisors}
          subtitle="Active in your zone"
          icon={UserCheck}
          color="blue"
          linkTo="/manager/supervisors"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Total Operators"
          value={stats.totalOperators}
          subtitle="Under supervision"
          icon={Users}
          color="purple"
          linkTo="/manager/operators"
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Active Locations"
          value={stats.activeLocations}
          subtitle="Currently monitored"
          icon={MapPin}
          color="amber"
          linkTo="/manager/locations"
        />
      </div>

      {/* Alert Banner - Show if there are critical items */}
      {stats.openIncidents > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <div className="flex items-start sm:items-center gap-3 flex-col sm:flex-row">
            <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base text-red-800">
                {stats.openIncidents} Open Incident{stats.openIncidents > 1 ? 's' : ''} Require Attention
              </p>
              <p className="text-xs sm:text-sm text-red-600 mt-0.5">Review and escalate if necessary</p>
            </div>
            <Link 
              to="/manager/incidents"
              className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Eye className="w-4 h-4" />
              View All
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* On Duty Personnel */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">On Duty Now</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Active personnel ({onDutyPersonnel.length})</p>
                </div>
              </div>
              <Link 
                to="/manager/attendance"
                className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 flex-shrink-0"
              >
                <span className="hidden sm:inline">View All</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </div>
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
            {onDutyPersonnel.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-xs sm:text-sm">No personnel on duty</p>
              </div>
            ) : (
              onDutyPersonnel.slice(0, 10).map(assignment => {
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
                    <div className="relative flex-shrink-0">
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
                        {assignment.beatId && (
                          <span className="text-[10px] text-gray-600 truncate">
                            @ {assignment.beatId.beatName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
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
              })
            )}
          </div>
          {onDutyPersonnel.length > 10 && (
            <div className="p-3 sm:p-4 border-t border-gray-100">
              <Link 
                to="/manager/attendance"
                className="w-full py-2 text-xs sm:text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center justify-center"
              >
                View All {onDutyPersonnel.length} Personnel
              </Link>
            </div>
          )}
        </div>

        {/* Recent Incidents */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">Recent Incidents</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Latest reported issues</p>
                </div>
              </div>
              <Link 
                to="/manager/incidents"
                className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 flex-shrink-0"
              >
                <span className="hidden sm:inline">View All</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </div>
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            {recentIncidents.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">No recent incidents</p>
            ) : (
              recentIncidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))
            )}
          </div>
        </div>

        {/* Top Supervisors */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">Supervisor Overview</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Performance rankings</p>
                </div>
              </div>
              <Link 
                to="/manager/supervisors"
                className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 flex-shrink-0"
              >
                <span className="hidden sm:inline">View All</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </div>
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            {topSupervisors.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">No supervisors found</p>
            ) : (
              topSupervisors.map((supervisor) => (
                <SupervisorCard key={supervisor.id} supervisor={supervisor} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Location Status */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">Location Status</h3>
                <p className="text-xs sm:text-sm text-gray-500">Real-time staffing overview</p>
              </div>
            </div>
            <Link 
              to="/manager/locations"
              className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 flex-shrink-0"
            >
              <span className="hidden sm:inline">View All</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>
        <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {locationStatuses.length === 0 ? (
            <p className="col-span-2 text-center text-gray-500 py-8 text-sm">No locations found</p>
          ) : (
            locationStatuses.map((location) => (
              <LocationCard key={location.id} location={location} />
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          to="/manager/attendance"
          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all group"
        >
          <div className="p-2 sm:p-3 bg-emerald-100 rounded-lg sm:rounded-xl group-hover:bg-emerald-200 transition-colors flex-shrink-0">
            <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm sm:text-base text-gray-900 truncate">View Attendance</p>
            <p className="text-xs sm:text-sm text-gray-500">Check daily records</p>
          </div>
        </Link>
        <Link
          to="/manager/activity-logs"
          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl group-hover:bg-blue-200 transition-colors flex-shrink-0">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm sm:text-base text-gray-900 truncate">Activity Logs</p>
            <p className="text-xs sm:text-sm text-gray-500">Review system activities</p>
          </div>
        </Link>
        <Link
          to="/manager/requests"
          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all group"
        >
          <div className="p-2 sm:p-3 bg-amber-100 rounded-lg sm:rounded-xl group-hover:bg-amber-200 transition-colors flex-shrink-0">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm sm:text-base text-gray-900 truncate">Pending Requests</p>
            <p className="text-xs sm:text-sm text-gray-500">{stats.pendingRequests} awaiting review</p>
          </div>
        </Link>
        <Link
          to="/manager/analytics"
          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group"
        >
          <div className="p-2 sm:p-3 bg-purple-100 rounded-lg sm:rounded-xl group-hover:bg-purple-200 transition-colors flex-shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm sm:text-base text-gray-900 truncate">Analytics</p>
            <p className="text-xs sm:text-sm text-gray-500">View reports & trends</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
