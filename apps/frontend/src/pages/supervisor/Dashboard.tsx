import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  MapPin,
  ClipboardCheck,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  ChevronRight,
  Zap,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

// Types
interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: any;
  trend?: { value: number; isPositive: boolean };
  color: 'green' | 'blue' | 'yellow' | 'red' | 'indigo' | 'purple';
  linkTo?: string;
}

interface Operator {
  id: string;
  name: string;
  photo?: string;
  location: string;
  status: 'present' | 'absent' | 'late';
  checkInTime?: string;
}

interface Location {
  id: string;
  name: string;
  operatorsAssigned: number;
  operatorsPresent: number;
  lastVisit?: string;
  status: 'green' | 'yellow' | 'red';
}

interface Incident {
  id: string;
  title: string;
  location: string;
  severity: 'high' | 'medium' | 'low';
  time: string;
  status: 'open' | 'investigating' | 'resolved';
}

// Stats Card Component
function StatsCard({ title, value, subtitle, icon: Icon, trend, color, linkTo }: StatsCardProps) {
  const colorStyles = {
    green: 'bg-green-500 shadow-green-200',
    blue: 'bg-blue-500 shadow-blue-200',
    yellow: 'bg-yellow-500 shadow-yellow-200',
    red: 'bg-red-500 shadow-red-200',
    indigo: 'bg-indigo-500 shadow-indigo-200',
    purple: 'bg-purple-500 shadow-purple-200',
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
        <div className="mt-3 flex items-center text-green-600 text-sm font-medium">
          View Details <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      )}
    </div>
  );

  return linkTo ? <Link to={linkTo}>{content}</Link> : content;
}

// Operator Card Component
function OperatorCard({ operator }: { operator: Operator }) {
  const statusColors = {
    present: 'bg-green-100 text-green-700',
    absent: 'bg-red-100 text-red-700',
    late: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center overflow-hidden flex-shrink-0">
        {operator.photo ? (
          <img src={operator.photo} alt={operator.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-green-600 font-semibold">
            {operator.name.split(' ').map(n => n[0]).join('')}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 truncate">{operator.name}</p>
        <p className="text-sm text-slate-500">{operator.location}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[operator.status]}`}>
          {operator.status}
        </span>
        {operator.checkInTime && (
          <span className="text-xs text-slate-400">{operator.checkInTime}</span>
        )}
      </div>
    </div>
  );
}

// Location Card Component
function LocationCard({ location }: { location: Location }) {
  const statusColors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  const percentage = Math.round((location.operatorsPresent / location.operatorsAssigned) * 100);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
      <div className={`w-3 h-3 rounded-full ${statusColors[location.status]}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate">{location.name}</p>
        {location.lastVisit && (
          <p className="text-xs text-slate-500">Last visit: {location.lastVisit}</p>
        )}
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-slate-900">
          {location.operatorsPresent}/{location.operatorsAssigned}
        </p>
        <p className={`text-xs ${percentage >= 80 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
          {percentage}%
        </p>
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
        <p className="text-sm text-slate-500">{incident.location}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        {statusIcons[incident.status]}
        <p className="text-xs text-slate-400">{incident.time}</p>
      </div>
    </div>
  );
}

export default function SupervisorDashboard() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real data from API
  const [stats, setStats] = useState({
    myOperators: 0,
    presentToday: 0,
    attendanceRate: 0,
    myBits: 0,
    openIncidents: 0,
    pendingTasks: 0,
  });

  const [operators, setOperators] = useState<Operator[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const API_BASE = window.location.origin.includes('3000') 
        ? window.location.origin.replace('3000', '3002')
        : window.location.origin;
      
      const response = await fetch(`${API_BASE}/api/supervisors/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Dashboard data:', data);
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.operators) {
          setOperators(data.operators);
        }
        if (data.locations) {
          setLocations(data.locations);
        }
        if (data.incidents) {
          setIncidents(data.incidents);
        }
      } else {
        console.error('Failed to fetch dashboard data:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
        <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-800 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {getGreeting()}, {user?.firstName || 'Supervisor'}! 👋
          </h1>
          <p className="text-green-200 mt-1 text-sm sm:text-base">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-white/80 mt-2 text-sm">
            Monitor your locations and operators effectively
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            title="My Operators"
            value={stats.myOperators}
            subtitle="Total assigned"
            icon={Users}
            color="green"
            linkTo="/supervisor/operators"
          />
          <StatsCard
            title="Present Today"
            value={stats.presentToday}
            subtitle={`${stats.attendanceRate}% attendance`}
            icon={ClipboardCheck}
            color="blue"
            linkTo="/supervisor/attendance"
            trend={{ value: 5, isPositive: true }}
          />
          <div className="col-span-2 lg:col-span-1">
            <StatsCard
              title="My Beats"
              value={stats.myBits}
              subtitle="Locations assigned"
              icon={MapPin}
              color="purple"
              linkTo="/supervisor/beats"
            />
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <StatsCard
            title="Open Incidents"
            value={stats.openIncidents}
            subtitle="Requires attention"
            icon={AlertTriangle}
            color="red"
            linkTo="/supervisor/incidents"
          />
          <StatsCard
            title="Pending Tasks"
            value={stats.pendingTasks}
            subtitle="Action needed"
            icon={Clock}
            color="yellow"
            linkTo="/supervisor/attendance"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-500" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/supervisor/operators/register"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-all duration-300 hover:shadow-lg"
            >
              <UserCheck className="w-6 h-6" />
              <span className="text-sm font-medium text-center">Register Operator</span>
            </Link>
            <Link
              to="/supervisor/attendance"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 hover:shadow-lg"
            >
              <ClipboardCheck className="w-6 h-6" />
              <span className="text-sm font-medium text-center">Mark Attendance</span>
            </Link>
            <Link
              to="/supervisor/beats"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-all duration-300 hover:shadow-lg"
            >
              <MapPin className="w-6 h-6" />
              <span className="text-sm font-medium text-center">Visit Beats</span>
            </Link>
            <Link
              to="/supervisor/incidents"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all duration-300 hover:shadow-lg"
            >
              <AlertTriangle className="w-6 h-6" />
              <span className="text-sm font-medium text-center">Report Incident</span>
            </Link>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Operators */}
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                My Operators
              </h2>
              <Link 
                to="/supervisor/operators"
                className="text-green-600 text-sm font-medium hover:text-green-700 flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {operators.length > 0 ? (
                operators.slice(0, 5).map(operator => (
                  <OperatorCard key={operator.id} operator={operator} />
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No operators registered yet</p>
                  <Link 
                    to="/supervisor/operators/register"
                    className="text-green-600 text-sm font-medium hover:underline mt-2 inline-block"
                  >
                    Register your first operator
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* My Beats/Locations */}
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-500" />
                My Locations
              </h2>
              <Link 
                to="/supervisor/beats"
                className="text-green-600 text-sm font-medium hover:text-green-700 flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            {/* Status Legend */}
            <div className="flex gap-4 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-slate-600">Full Staff</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-slate-600">Partial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-slate-600">Critical</span>
              </div>
            </div>

            <div className="space-y-3">
              {locations.length > 0 ? (
                locations.map(location => (
                  <LocationCard key={location.id} location={location} />
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No locations assigned yet</p>
                </div>
              )}
            </div>
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
              to="/supervisor/incidents"
              className="text-green-600 text-sm font-medium hover:text-green-700 flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {incidents.length > 0 ? (
              incidents.map(incident => (
                <IncidentCard key={incident.id} incident={incident} />
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500 opacity-50" />
                <p className="text-sm">No recent incidents</p>
                <p className="text-xs mt-1">All systems running smoothly</p>
              </div>
            )}
          </div>
        </div>

        {/* Today's Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            Today's Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{stats.presentToday}</p>
              <p className="text-sm text-slate-600">Operators Present</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{stats.myBits}</p>
              <p className="text-sm text-slate-600">Beats to Visit</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-purple-600">0</p>
              <p className="text-sm text-slate-600">Visits Done</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingTasks}</p>
              <p className="text-sm text-slate-600">Tasks Pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
