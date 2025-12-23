import { useState } from 'react';
import {
  Download,
  BarChart2,
  TrendingUp,
  MapPin,
  ChevronDown,
  RefreshCw,
  Star,
  AlertTriangle,
  CheckCircle,
  Printer
} from 'lucide-react';

interface ReportData {
  supervisors: {
    id: string;
    name: string;
    locations: number;
    operators: number;
    visits: number;
    incidents: number;
    performanceScore: number;
    attendanceRate: number;
  }[];
  locationStats: {
    id: string;
    name: string;
    visits: number;
    incidents: number;
    avgStaffing: number;
    coverage: number;
  }[];
  weeklyStats: {
    week: string;
    visits: number;
    incidents: number;
    attendance: number;
  }[];
}

// Mock data
const mockReportData: ReportData = {
  supervisors: [
    { id: 'sup-001', name: 'John Smith', locations: 3, operators: 12, visits: 45, incidents: 8, performanceScore: 92, attendanceRate: 98 },
    { id: 'sup-002', name: 'Sarah Johnson', locations: 4, operators: 15, visits: 52, incidents: 12, performanceScore: 95, attendanceRate: 99 },
    { id: 'sup-003', name: 'Michael Williams', locations: 2, operators: 8, visits: 28, incidents: 5, performanceScore: 88, attendanceRate: 94 },
    { id: 'sup-004', name: 'Emily Brown', locations: 3, operators: 10, visits: 38, incidents: 3, performanceScore: 90, attendanceRate: 97 },
    { id: 'sup-005', name: 'David Davis', locations: 2, operators: 6, visits: 22, incidents: 18, performanceScore: 75, attendanceRate: 85 }
  ],
  locationStats: [
    { id: 'loc-001', name: 'Downtown Office', visits: 48, incidents: 5, avgStaffing: 95, coverage: 100 },
    { id: 'loc-002', name: 'North Mall', visits: 35, incidents: 12, avgStaffing: 75, coverage: 85 },
    { id: 'loc-003', name: 'Tech Park', visits: 42, incidents: 3, avgStaffing: 98, coverage: 100 },
    { id: 'loc-004', name: 'East Campus', visits: 30, incidents: 8, avgStaffing: 88, coverage: 95 },
    { id: 'loc-005', name: 'West Plaza', visits: 15, incidents: 2, avgStaffing: 60, coverage: 70 },
    { id: 'loc-006', name: 'South Terminal', visits: 38, incidents: 15, avgStaffing: 65, coverage: 75 }
  ],
  weeklyStats: [
    { week: 'Week 1', visits: 45, incidents: 8, attendance: 94 },
    { week: 'Week 2', visits: 52, incidents: 12, attendance: 92 },
    { week: 'Week 3', visits: 48, incidents: 6, attendance: 96 },
    { week: 'Week 4', visits: 55, incidents: 10, attendance: 95 }
  ]
};

export default function ReportsPage() {
  const [reportData] = useState<ReportData>(mockReportData);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'visits' | 'ranking'>('overview');
  const [dateRange, setDateRange] = useState<string>('this_month');
  const [loading, setLoading] = useState(false);

  const generateReport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Report generated successfully!');
    }, 1500);
  };

  const totalVisits = reportData.locationStats.reduce((sum, loc) => sum + loc.visits, 0);
  const totalIncidents = reportData.locationStats.reduce((sum, loc) => sum + loc.incidents, 0);
  const avgPerformance = Math.round(reportData.supervisors.reduce((sum, sup) => sum + sup.performanceScore, 0) / reportData.supervisors.length);
  const avgAttendance = Math.round(reportData.supervisors.reduce((sum, sup) => sum + sup.attendanceRate, 0) / reportData.supervisors.length);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and view performance reports</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_quarter">This Quarter</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Visits</p>
              <p className="text-2xl font-bold text-gray-900">{totalVisits}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Incidents</p>
              <p className="text-2xl font-bold text-gray-900">{totalIncidents}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Performance</p>
              <p className="text-2xl font-bold text-gray-900">{avgPerformance}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{avgAttendance}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart2 },
              { key: 'performance', label: 'Performance Report', icon: TrendingUp },
              { key: 'visits', label: 'Location Visits', icon: MapPin },
              { key: 'ranking', label: 'Supervisor Ranking', icon: Star }
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
              {/* Weekly Stats Chart Placeholder */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Performance Trends</h3>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-end justify-between h-48 gap-4">
                    {reportData.weeklyStats.map((week) => (
                      <div key={week.week} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex gap-1 justify-center h-40">
                          <div 
                            className="w-1/3 bg-blue-500 rounded-t"
                            style={{ height: `${(week.visits / 60) * 100}%` }}
                            title={`Visits: ${week.visits}`}
                          />
                          <div 
                            className="w-1/3 bg-red-500 rounded-t"
                            style={{ height: `${(week.incidents / 15) * 100}%` }}
                            title={`Incidents: ${week.incidents}`}
                          />
                          <div 
                            className="w-1/3 bg-green-500 rounded-t"
                            style={{ height: `${week.attendance}%` }}
                            title={`Attendance: ${week.attendance}%`}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{week.week}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded" />
                      <span className="text-gray-600">Visits</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded" />
                      <span className="text-gray-600">Incidents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded" />
                      <span className="text-gray-600">Attendance</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Performing Supervisors */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Supervisors</h3>
                  <div className="space-y-3">
                    {reportData.supervisors
                      .sort((a, b) => b.performanceScore - a.performanceScore)
                      .slice(0, 3)
                      .map((sup, index) => (
                        <div key={sup.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{sup.name}</p>
                            <p className="text-sm text-gray-500">{sup.locations} locations, {sup.operators} operators</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{sup.performanceScore}%</p>
                            <p className="text-xs text-gray-500">Score</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Locations Needing Attention */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Locations Needing Attention</h3>
                  <div className="space-y-3">
                    {reportData.locationStats
                      .filter(loc => loc.coverage < 90)
                      .slice(0, 3)
                      .map((loc) => (
                        <div key={loc.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle size={18} className="text-red-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{loc.name}</p>
                            <p className="text-sm text-gray-500">{loc.incidents} incidents this period</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600">{loc.coverage}%</p>
                            <p className="text-xs text-gray-500">Coverage</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Report Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Supervisor Performance Report</h3>
                <div className="flex gap-2">
                  <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Printer size={16} />
                    Print
                  </button>
                  <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Download size={16} />
                    Export
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Supervisor</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Locations</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Operators</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Visits</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Incidents</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Performance</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.supervisors.map((sup) => (
                      <tr key={sup.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                              {sup.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="font-medium text-gray-900">{sup.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600">{sup.locations}</td>
                        <td className="py-3 px-4 text-center text-gray-600">{sup.operators}</td>
                        <td className="py-3 px-4 text-center text-gray-600">{sup.visits}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`${sup.incidents > 10 ? 'text-red-600' : 'text-gray-600'}`}>
                            {sup.incidents}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-medium ${
                            sup.performanceScore >= 90 ? 'text-green-600' : 
                            sup.performanceScore >= 80 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {sup.performanceScore}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-medium ${
                            sup.attendanceRate >= 95 ? 'text-green-600' : 
                            sup.attendanceRate >= 90 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {sup.attendanceRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Location Visits Tab */}
          {activeTab === 'visits' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Location Visit Report</h3>
                <div className="flex gap-2">
                  <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Printer size={16} />
                    Print
                  </button>
                  <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Download size={16} />
                    Export
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Location</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Total Visits</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Incidents</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Avg Staffing</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Coverage</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.locationStats.map((loc) => (
                      <tr key={loc.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <MapPin size={18} className="text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-900">{loc.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600">{loc.visits}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`${loc.incidents > 10 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                            {loc.incidents}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600">{loc.avgStaffing}%</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  loc.coverage >= 90 ? 'bg-green-500' : loc.coverage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${loc.coverage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{loc.coverage}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            loc.coverage >= 90 ? 'bg-green-100 text-green-700' : 
                            loc.coverage >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {loc.coverage >= 90 ? 'Good' : loc.coverage >= 70 ? 'Fair' : 'Critical'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Supervisor Ranking Tab */}
          {activeTab === 'ranking' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Supervisor Ranking</h3>
                <div className="flex gap-2">
                  <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Printer size={16} />
                    Print
                  </button>
                  <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Download size={16} />
                    Export
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {reportData.supervisors
                  .sort((a, b) => b.performanceScore - a.performanceScore)
                  .map((sup, index) => (
                    <div 
                      key={sup.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        index === 0 ? 'bg-yellow-50 border-yellow-200' :
                        index === 1 ? 'bg-gray-50 border-gray-200' :
                        index === 2 ? 'bg-orange-50 border-orange-200' : 'border-gray-100'
                      }`}
                    >
                      {/* Rank Badge */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-400 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>

                      {/* Profile */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                          {sup.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{sup.name}</p>
                          <p className="text-sm text-gray-500">{sup.locations} locations • {sup.operators} operators</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-6 text-center">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{sup.visits}</p>
                          <p className="text-xs text-gray-500">Visits</p>
                        </div>
                        <div>
                          <p className={`text-2xl font-bold ${sup.incidents > 10 ? 'text-red-600' : 'text-gray-900'}`}>
                            {sup.incidents}
                          </p>
                          <p className="text-xs text-gray-500">Incidents</p>
                        </div>
                        <div>
                          <p className={`text-2xl font-bold ${
                            sup.performanceScore >= 90 ? 'text-green-600' : 
                            sup.performanceScore >= 80 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {sup.performanceScore}%
                          </p>
                          <p className="text-xs text-gray-500">Performance</p>
                        </div>
                        <div>
                          <p className={`text-2xl font-bold ${
                            sup.attendanceRate >= 95 ? 'text-green-600' : 
                            sup.attendanceRate >= 90 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {sup.attendanceRate}%
                          </p>
                          <p className="text-xs text-gray-500">Attendance</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
