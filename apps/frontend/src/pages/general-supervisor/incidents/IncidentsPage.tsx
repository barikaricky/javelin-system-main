import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  RefreshCw,
  Eye,
  MapPin,
  User,
  Calendar,
  FileText,
  MoreVertical
} from 'lucide-react';

interface Incident {
  id: string;
  title: string;
  description: string;
  type: 'security' | 'safety' | 'equipment' | 'personnel' | 'other';
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  reportedBy: {
    id: string;
    name: string;
    type: 'supervisor' | 'operator';
  };
  location: string;
  dateReported: string;
  timeReported: string;
  dateResolved: string | null;
  assignedTo: string | null;
  notes: string;
}

// Mock data
const mockIncidents: Incident[] = [
  {
    id: 'inc-001',
    title: 'Unauthorized Access Attempt',
    description: 'Individual attempted to enter restricted area without proper credentials. Escort provided and incident documented.',
    type: 'security',
    priority: 'high',
    status: 'investigating',
    reportedBy: { id: 'sup-001', name: 'John Smith', type: 'supervisor' },
    location: 'Downtown Office',
    dateReported: '2025-01-20',
    timeReported: '09:45 AM',
    dateResolved: null,
    assignedTo: 'John Smith',
    notes: 'Awaiting footage review from security cameras'
  },
  {
    id: 'inc-002',
    title: 'Fire Alarm False Activation',
    description: 'Fire alarm triggered in Section B due to steam from kitchen. Building evacuated per protocol.',
    type: 'safety',
    priority: 'medium',
    status: 'resolved',
    reportedBy: { id: 'op-002', name: 'Maria Garcia', type: 'operator' },
    location: 'North Mall',
    dateReported: '2025-01-19',
    timeReported: '02:30 PM',
    dateResolved: '2025-01-19',
    assignedTo: 'Sarah Johnson',
    notes: 'Maintenance notified to adjust sensor sensitivity'
  },
  {
    id: 'inc-003',
    title: 'CCTV Camera Malfunction',
    description: 'Camera #12 in parking lot B stopped recording. Temporary blind spot created.',
    type: 'equipment',
    priority: 'high',
    status: 'open',
    reportedBy: { id: 'op-003', name: 'James Wilson', type: 'operator' },
    location: 'Tech Park',
    dateReported: '2025-01-20',
    timeReported: '06:15 AM',
    dateResolved: null,
    assignedTo: null,
    notes: 'IT team notified for urgent repair'
  },
  {
    id: 'inc-004',
    title: 'Employee Altercation',
    description: 'Verbal dispute between two staff members in break room. Separated and documented.',
    type: 'personnel',
    priority: 'medium',
    status: 'closed',
    reportedBy: { id: 'sup-002', name: 'Sarah Johnson', type: 'supervisor' },
    location: 'Downtown Office',
    dateReported: '2025-01-18',
    timeReported: '11:20 AM',
    dateResolved: '2025-01-18',
    assignedTo: 'HR Department',
    notes: 'HR follow-up completed. Both employees counseled.'
  },
  {
    id: 'inc-005',
    title: 'Suspicious Package',
    description: 'Unattended bag found near entrance. Area cordoned and package inspected.',
    type: 'security',
    priority: 'high',
    status: 'resolved',
    reportedBy: { id: 'op-005', name: 'Robert Taylor', type: 'operator' },
    location: 'North Mall',
    dateReported: '2025-01-20',
    timeReported: '10:00 AM',
    dateResolved: '2025-01-20',
    assignedTo: 'John Smith',
    notes: 'Package contained personal items. Owner identified and returned.'
  },
  {
    id: 'inc-006',
    title: 'Water Leak in Stairwell',
    description: 'Minor water leak detected in stairwell C, floor 2. Area marked as hazard.',
    type: 'safety',
    priority: 'low',
    status: 'investigating',
    reportedBy: { id: 'op-001', name: 'Alex Johnson', type: 'operator' },
    location: 'Tech Park',
    dateReported: '2025-01-19',
    timeReported: '04:45 PM',
    dateResolved: null,
    assignedTo: 'Maintenance',
    notes: 'Plumber scheduled for tomorrow morning'
  }
];

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setIncidents(mockIncidents);
      setLoading(false);
    };
    fetchIncidents();
  }, []);

  // Get unique locations
  const locations = [...new Set(incidents.map(i => i.location))];

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = 
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || incident.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    const matchesType = typeFilter === 'all' || incident.type === typeFilter;
    const matchesLocation = locationFilter === 'all' || incident.location === locationFilter;
    return matchesSearch && matchesPriority && matchesStatus && matchesType && matchesLocation;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertTriangle size={12} />
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <AlertCircle size={12} />
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Clock size={12} />
            Low
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            Open
          </span>
        );
      case 'investigating':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            Investigating
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Resolved
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      security: 'bg-purple-100 text-purple-700',
      safety: 'bg-orange-100 text-orange-700',
      equipment: 'bg-blue-100 text-blue-700',
      personnel: 'bg-pink-100 text-pink-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${colors[type]}`}>
        {type}
      </span>
    );
  };

  const stats = {
    total: incidents.length,
    open: incidents.filter(i => i.status === 'open').length,
    investigating: incidents.filter(i => i.status === 'investigating').length,
    highPriority: incidents.filter(i => i.priority === 'high' && i.status !== 'closed').length
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="text-gray-600">Monitor and track all incidents across locations</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Incidents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Open</p>
              <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Investigating</p>
              <p className="text-2xl font-bold text-gray-900">{stats.investigating}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">{stats.highPriority}</p>
            </div>
          </div>
        </div>
      </div>

      {/* High Priority Alert */}
      {stats.highPriority > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">{stats.highPriority} high priority incident(s) require attention</p>
            <p className="text-red-600 text-sm">Review and address these incidents immediately.</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Types</option>
              <option value="security">Security</option>
              <option value="safety">Safety</option>
              <option value="equipment">Equipment</option>
              <option value="personnel">Personnel</option>
              <option value="other">Other</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Location Filter */}
          <div className="relative">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {filteredIncidents.map((incident) => (
          <div 
            key={incident.id}
            className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${
              incident.priority === 'high' && incident.status !== 'closed' 
                ? 'border-red-200' 
                : 'border-gray-100'
            }`}
          >
            <div className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {getPriorityBadge(incident.priority)}
                    {getStatusBadge(incident.status)}
                    {getTypeBadge(incident.type)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{incident.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{incident.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{incident.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{incident.dateReported} at {incident.timeReported}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>
                        Reported by: {incident.reportedBy.name} 
                        <span className="text-gray-400 ml-1">({incident.reportedBy.type})</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section */}
                <div className="flex items-start gap-2">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Assigned to:</p>
                    <p className="font-medium text-gray-900">{incident.assignedTo || 'Unassigned'}</p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setSelectedIncident(selectedIncident === incident.id ? null : incident.id)}
                      className="p-2 rounded hover:bg-gray-100"
                    >
                      <MoreVertical size={18} className="text-gray-500" />
                    </button>
                    {selectedIncident === incident.id && (
                      <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[150px] z-10">
                        <Link
                          to={`/gs/incidents/${incident.id}`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Eye size={16} />
                          View Details
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {incident.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Notes:</span> {incident.notes}
                  </p>
                </div>
              )}

              {/* Resolution Info */}
              {incident.dateResolved && (
                <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle size={14} />
                  <span>Resolved on {incident.dateResolved}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredIncidents.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No incidents found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || priorityFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all' || locationFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No incidents have been reported'}
          </p>
          {(searchQuery || priorityFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all' || locationFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPriorityFilter('all');
                setStatusFilter('all');
                setTypeFilter('all');
                setLocationFilter('all');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
