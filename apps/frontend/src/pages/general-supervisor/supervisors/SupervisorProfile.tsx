import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Users,
  Building,
  Activity,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Award,
  BarChart2,
  Eye,
  MessageSquare
} from 'lucide-react';

interface SupervisorDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePhoto: string | null;
  status: 'active' | 'inactive' | 'on_leave';
  address: string;
  emergencyContact: string;
  joinDate: string;
  assignedLocations: Location[];
  operators: Operator[];
  performanceScore: number;
  shiftsCompleted: number;
  incidentsReported: number;
  attendanceRate: number;
  lastActive: string;
  recentActivity: ActivityLog[];
  visitLogs: VisitLog[];
}

interface Location {
  id: string;
  name: string;
  address: string;
  operatorCount: number;
}

interface Operator {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  timestamp: string;
}

interface VisitLog {
  id: string;
  locationName: string;
  checkInTime: string;
  checkOutTime: string | null;
  duration: string;
  notes: string;
}

// Mock data
const mockSupervisor: SupervisorDetail = {
  id: 'sup-001',
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@company.com',
  phone: '+1 234 567 8901',
  profilePhoto: null,
  status: 'active',
  address: '123 Main Street, City, State 12345',
  emergencyContact: '+1 234 567 8999',
  joinDate: '2024-01-15',
  performanceScore: 92,
  shiftsCompleted: 156,
  incidentsReported: 8,
  attendanceRate: 98,
  lastActive: '2 hours ago',
  assignedLocations: [
    { id: 'loc-1', name: 'Downtown Office', address: '100 Business Ave', operatorCount: 5 },
    { id: 'loc-2', name: 'North Mall', address: '200 Shopping Blvd', operatorCount: 4 },
    { id: 'loc-3', name: 'Tech Park', address: '300 Innovation Dr', operatorCount: 3 }
  ],
  operators: [
    { id: 'op-1', firstName: 'Alex', lastName: 'Johnson', status: 'on_duty' },
    { id: 'op-2', firstName: 'Maria', lastName: 'Garcia', status: 'on_duty' },
    { id: 'op-3', firstName: 'James', lastName: 'Wilson', status: 'off_duty' },
    { id: 'op-4', firstName: 'Lisa', lastName: 'Anderson', status: 'on_duty' },
    { id: 'op-5', firstName: 'Robert', lastName: 'Taylor', status: 'break' }
  ],
  recentActivity: [
    { id: 'act-1', action: 'Check-in', description: 'Checked in at Downtown Office', timestamp: '2 hours ago' },
    { id: 'act-2', action: 'Incident Report', description: 'Filed incident report #IR-456', timestamp: '3 hours ago' },
    { id: 'act-3', action: 'Operator Review', description: 'Reviewed operator Alex Johnson', timestamp: '4 hours ago' },
    { id: 'act-4', action: 'Check-out', description: 'Checked out from North Mall', timestamp: '1 day ago' },
    { id: 'act-5', action: 'Shift End', description: 'Completed evening shift', timestamp: '1 day ago' }
  ],
  visitLogs: [
    { id: 'v-1', locationName: 'Downtown Office', checkInTime: '08:00 AM', checkOutTime: '10:30 AM', duration: '2h 30m', notes: 'Routine check' },
    { id: 'v-2', locationName: 'North Mall', checkInTime: '11:00 AM', checkOutTime: '01:00 PM', duration: '2h', notes: 'Operator training' },
    { id: 'v-3', locationName: 'Tech Park', checkInTime: '02:00 PM', checkOutTime: null, duration: 'Ongoing', notes: 'Incident follow-up' }
  ]
};

export default function SupervisorProfile() {
  const { id } = useParams();
  const [supervisor, setSupervisor] = useState<SupervisorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'locations' | 'operators' | 'activity' | 'visits'>('overview');

  useEffect(() => {
    const fetchSupervisor = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setSupervisor(mockSupervisor);
      setLoading(false);
    };
    fetchSupervisor();
  }, [id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
            <CheckCircle size={14} />
            Active
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
            <Clock size={14} />
            Inactive
          </span>
        );
      case 'on_leave':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
            <AlertTriangle size={14} />
            On Leave
          </span>
        );
      default:
        return null;
    }
  };

  const getOperatorStatusBadge = (status: string) => {
    switch (status) {
      case 'on_duty':
        return <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">On Duty</span>;
      case 'off_duty':
        return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">Off Duty</span>;
      case 'break':
        return <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">On Break</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-48 bg-gray-200 rounded-xl"></div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!supervisor) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Supervisor not found</h2>
          <Link to="/gs/supervisors" className="text-blue-600 hover:text-blue-700">
            Back to Supervisors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <Link
        to="/gs/supervisors"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={20} />
        Back to Supervisors
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-32"></div>
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
            {supervisor.profilePhoto ? (
              <img
                src={supervisor.profilePhoto}
                alt={`${supervisor.firstName} ${supervisor.lastName}`}
                className="w-24 h-24 rounded-xl border-4 border-white object-cover shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl border-4 border-white bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                {supervisor.firstName[0]}{supervisor.lastName[0]}
              </div>
            )}
            <div className="flex-1 pb-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {supervisor.firstName} {supervisor.lastName}
                  </h1>
                  <p className="text-gray-600">Supervisor</p>
                </div>
                {getStatusBadge(supervisor.status)}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 text-gray-600">
              <Mail size={18} />
              <span>{supervisor.email}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Phone size={18} />
              <span>{supervisor.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar size={18} />
              <span>Joined {new Date(supervisor.joinDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="p-2 bg-purple-100 rounded-lg w-fit mx-auto mb-2">
            <Star size={20} className="text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{supervisor.performanceScore}%</p>
          <p className="text-sm text-gray-500">Performance</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="p-2 bg-blue-100 rounded-lg w-fit mx-auto mb-2">
            <Building size={20} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{supervisor.assignedLocations.length}</p>
          <p className="text-sm text-gray-500">Locations</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="p-2 bg-green-100 rounded-lg w-fit mx-auto mb-2">
            <Users size={20} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{supervisor.operators.length}</p>
          <p className="text-sm text-gray-500">Operators</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="p-2 bg-orange-100 rounded-lg w-fit mx-auto mb-2">
            <BarChart2 size={20} className="text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{supervisor.shiftsCompleted}</p>
          <p className="text-sm text-gray-500">Shifts</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="p-2 bg-emerald-100 rounded-lg w-fit mx-auto mb-2">
            <Award size={20} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{supervisor.attendanceRate}%</p>
          <p className="text-sm text-gray-500">Attendance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {[
              { key: 'overview', label: 'Overview', icon: Eye },
              { key: 'locations', label: 'Locations', icon: Building },
              { key: 'operators', label: 'Operators', icon: Users },
              { key: 'activity', label: 'Activity', icon: Activity },
              { key: 'visits', label: 'Visit Logs', icon: MapPin }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="text-gray-900">{supervisor.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Emergency Contact</p>
                        <p className="text-gray-900">{supervisor.emergencyContact}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Last Active</p>
                        <p className="text-gray-900">{supervisor.lastActive}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Performance Score</span>
                        <span className="font-medium">{supervisor.performanceScore}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                          style={{ width: `${supervisor.performanceScore}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Attendance Rate</span>
                        <span className="font-medium">{supervisor.attendanceRate}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                          style={{ width: `${supervisor.attendanceRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-gray-600">Incidents Reported</span>
                      <span className="text-xl font-bold text-gray-900">{supervisor.incidentsReported}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Preview */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {supervisor.recentActivity.slice(0, 3).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Activity size={16} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                      </div>
                      <span className="text-xs text-gray-500">{activity.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Locations Tab */}
          {activeTab === 'locations' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Assigned Locations ({supervisor.assignedLocations.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {supervisor.assignedLocations.map((location) => (
                  <div key={location.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building size={20} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{location.name}</h4>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin size={14} />
                          {location.address}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          <Users size={14} className="inline mr-1" />
                          {location.operatorCount} operators
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Operators Tab */}
          {activeTab === 'operators' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Managed Operators ({supervisor.operators.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Operator</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supervisor.operators.map((operator) => (
                      <tr key={operator.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-medium text-sm">
                              {operator.firstName[0]}{operator.lastName[0]}
                            </div>
                            <span className="font-medium text-gray-900">
                              {operator.firstName} {operator.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getOperatorStatusBadge(operator.status)}
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            to={`/gs/operators/${operator.id}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            View Profile
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
              <div className="space-y-3">
                {supervisor.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900">{activity.action}</p>
                        <span className="text-sm text-gray-500">{activity.timestamp}</span>
                      </div>
                      <p className="text-gray-600 mt-1">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visits Tab */}
          {activeTab === 'visits' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Visit Logs</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Location</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Check In</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Check Out</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Duration</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supervisor.visitLogs.map((visit) => (
                      <tr key={visit.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Building size={16} className="text-gray-400" />
                            <span className="font-medium text-gray-900">{visit.locationName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{visit.checkInTime}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {visit.checkOutTime || (
                            <span className="text-green-600 font-medium">Currently Here</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${visit.checkOutTime ? 'text-gray-900' : 'text-green-600'}`}>
                            {visit.duration}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-sm">{visit.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <MessageSquare size={18} />
            Send Message
          </button>
          <Link
            to={`/gs/supervisors/${id}/activity`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Activity size={18} />
            Full Activity Log
          </Link>
          <Link
            to={`/gs/supervisors/${id}/visits`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MapPin size={18} />
            Visit History
          </Link>
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText size={18} />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}
