import { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    type: 'supervisor' | 'operator';
  };
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  hoursWorked: string;
  location: string;
  supervisor?: string;
  notes: string;
}

// Mock data
const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: 'att-001',
    employee: { id: 'sup-001', firstName: 'John', lastName: 'Smith', type: 'supervisor' },
    date: '2025-01-20',
    checkIn: '07:55 AM',
    checkOut: '04:02 PM',
    status: 'present',
    hoursWorked: '8h 7m',
    location: 'Downtown Office',
    notes: ''
  },
  {
    id: 'att-002',
    employee: { id: 'op-001', firstName: 'Alex', lastName: 'Johnson', type: 'operator' },
    date: '2025-01-20',
    checkIn: '08:15 AM',
    checkOut: '04:00 PM',
    status: 'late',
    hoursWorked: '7h 45m',
    location: 'Downtown Office',
    supervisor: 'John Smith',
    notes: 'Traffic delay'
  },
  {
    id: 'att-003',
    employee: { id: 'op-002', firstName: 'Maria', lastName: 'Garcia', type: 'operator' },
    date: '2025-01-20',
    checkIn: '08:00 AM',
    checkOut: '04:05 PM',
    status: 'present',
    hoursWorked: '8h 5m',
    location: 'Downtown Office',
    supervisor: 'John Smith',
    notes: ''
  },
  {
    id: 'att-004',
    employee: { id: 'sup-002', firstName: 'Sarah', lastName: 'Johnson', type: 'supervisor' },
    date: '2025-01-20',
    checkIn: '09:45 AM',
    checkOut: '01:30 PM',
    status: 'half_day',
    hoursWorked: '3h 45m',
    location: 'North Mall',
    notes: 'Medical appointment'
  },
  {
    id: 'att-005',
    employee: { id: 'op-003', firstName: 'James', lastName: 'Wilson', type: 'operator' },
    date: '2025-01-20',
    checkIn: null,
    checkOut: null,
    status: 'absent',
    hoursWorked: '0h',
    location: 'North Mall',
    supervisor: 'Sarah Johnson',
    notes: 'No show - no notice'
  },
  {
    id: 'att-006',
    employee: { id: 'op-004', firstName: 'Lisa', lastName: 'Anderson', type: 'operator' },
    date: '2025-01-20',
    checkIn: null,
    checkOut: null,
    status: 'on_leave',
    hoursWorked: '0h',
    location: 'North Mall',
    supervisor: 'Sarah Johnson',
    notes: 'Approved vacation'
  },
  {
    id: 'att-007',
    employee: { id: 'sup-003', firstName: 'Michael', lastName: 'Williams', type: 'supervisor' },
    date: '2025-01-20',
    checkIn: '05:58 AM',
    checkOut: '02:03 PM',
    status: 'present',
    hoursWorked: '8h 5m',
    location: 'Tech Park',
    notes: ''
  },
  {
    id: 'att-008',
    employee: { id: 'op-005', firstName: 'Robert', lastName: 'Taylor', type: 'operator' },
    date: '2025-01-20',
    checkIn: '06:00 AM',
    checkOut: '02:00 PM',
    status: 'present',
    hoursWorked: '8h 0m',
    location: 'Tech Park',
    supervisor: 'Michael Williams',
    notes: ''
  }
];

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setRecords(mockAttendanceRecords);
      setLoading(false);
    };
    fetchAttendance();
  }, [selectedDate]);

  // Get unique locations
  const locations = [...new Set(records.map(r => r.location))];

  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      `${record.employee.firstName} ${record.employee.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesType = typeFilter === 'all' || record.employee.type === typeFilter;
    const matchesLocation = locationFilter === 'all' || record.location === locationFilter;
    return matchesSearch && matchesStatus && matchesType && matchesLocation;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle size={12} />
            Present
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <UserX size={12} />
            Absent
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock size={12} />
            Late
          </span>
        );
      case 'half_day':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            <Clock size={12} />
            Half Day
          </span>
        );
      case 'on_leave':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Calendar size={12} />
            On Leave
          </span>
        );
      default:
        return null;
    }
  };

  const stats = {
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => r.status === 'late').length,
    absent: records.filter(r => r.status === 'absent').length,
    onLeave: records.filter(r => r.status === 'on_leave').length
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const current = new Date(selectedDate);
    if (direction === 'prev') {
      current.setDate(current.getDate() - 1);
    } else {
      current.setDate(current.getDate() + 1);
    }
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
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
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600">Track supervisor and operator attendance across all locations</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={18} />
            Export
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Date Navigator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => navigateDate('next')}
            disabled={selectedDate === new Date().toISOString().split('T')[0]}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Present</p>
              <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Late</p>
              <p className="text-2xl font-bold text-gray-900">{stats.late}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <UserX size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">On Leave</p>
              <p className="text-2xl font-bold text-gray-900">{stats.onLeave}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {stats.absent > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">{stats.absent} employee(s) absent today</p>
            <p className="text-red-600 text-sm">Review attendance records and take necessary action.</p>
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
              placeholder="Search by employee name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half Day</option>
              <option value="on_leave">On Leave</option>
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
              <option value="supervisor">Supervisors</option>
              <option value="operator">Operators</option>
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

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Employee</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Location</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Check In</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Check Out</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Hours</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                        record.employee.type === 'supervisor' 
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                          : 'bg-gradient-to-br from-green-500 to-emerald-600'
                      }`}>
                        {record.employee.firstName[0]}{record.employee.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {record.employee.firstName} {record.employee.lastName}
                        </p>
                        {record.supervisor && (
                          <p className="text-xs text-gray-500">Sup: {record.supervisor}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      record.employee.type === 'supervisor' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {record.employee.type === 'supervisor' ? 'Supervisor' : 'Operator'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{record.location}</td>
                  <td className="py-3 px-4">
                    {record.checkIn ? (
                      <span className="text-gray-900">{record.checkIn}</span>
                    ) : (
                      <span className="text-gray-400">--:--</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {record.checkOut ? (
                      <span className="text-gray-900">{record.checkOut}</span>
                    ) : (
                      <span className="text-gray-400">--:--</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${
                      record.hoursWorked === '0h' ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      {record.hoursWorked}
                    </span>
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(record.status)}</td>
                  <td className="py-3 px-4 text-sm text-gray-500 max-w-[150px] truncate">
                    {record.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredRecords.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || locationFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No attendance records for this date'}
          </p>
          {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || locationFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
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

      {/* Monthly Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary - {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">92%</p>
            <p className="text-sm text-gray-500 mt-1">Avg Attendance Rate</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">156</p>
            <p className="text-sm text-gray-500 mt-1">Total Work Days</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600">12</p>
            <p className="text-sm text-gray-500 mt-1">Late Arrivals</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-red-600">8</p>
            <p className="text-sm text-gray-500 mt-1">Absences</p>
          </div>
        </div>
      </div>
    </div>
  );
}
