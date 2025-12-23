import { Link } from 'react-router-dom';
import {
  CalendarIcon,
  UserPlusIcon,
  PaperAirplaneIcon,
  DocumentPlusIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="p-lg space-y-xl pb-24 lg:pb-lg">
      {/* TOP SECTION: Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg p-lg text-white">
        <h1 className="text-page-title mb-xs flex items-center gap-sm">
          <span>👋</span> Welcome back, Director Name
        </h1>
        <p className="text-sm opacity-90">
          {currentDate} | {currentTime}
        </p>
      </div>

      {/* SUMMARY STATISTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {/* Card 1: Total Personnel */}
        <Link to="/personnel" className="card bg-blue-50 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-4xl mb-sm">👥</div>
              <p className="text-large-number text-blue-600 mb-xs">245</p>
              <p className="text-section-header text-gray-700">Total Personnel</p>
              <p className="text-sm text-secondary-600 mt-xs">+12 this month</p>
            </div>
          </div>
        </Link>

        {/* Card 2: Guards on Duty */}
        <Link to="/attendance" className="card bg-secondary-50 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-4xl mb-sm">🛡️</div>
              <p className="text-large-number text-secondary-600 mb-xs">106</p>
              <p className="text-section-header text-gray-700">Guards on Duty</p>
              <p className="text-sm text-secondary-600 mt-xs">85% attendance</p>
            </div>
          </div>
        </Link>

        {/* Card 3: Active Managers */}
        <Link to="/managers" className="card bg-primary-50 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-4xl mb-sm">👤</div>
              <p className="text-large-number text-primary-700 mb-xs">18</p>
              <p className="text-section-header text-gray-700">Active Managers</p>
              <p className="text-sm text-primary-700 mt-xs">All locations</p>
            </div>
          </div>
        </Link>
      </div>

      {/* URGENT ALERTS SECTION */}
      <div className="space-y-md">
        {/* Pending Approvals Alert */}
        <div className="card bg-red-50 border-l-4 border-error">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-md flex-1">
              <div className="text-3xl">⚠️</div>
              <div className="flex-1">
                <div className="flex items-center gap-sm mb-xs">
                  <h3 className="text-section-header font-bold">Pending Approvals</h3>
                  <span className="bg-error text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                    5
                  </span>
                </div>
                <p className="text-sm text-gray-700">5 registration requests need your approval</p>
              </div>
            </div>
            <Link to="/approvals" className="btn-primary bg-error hover:bg-red-600 text-white whitespace-nowrap">
              Review Now
            </Link>
          </div>
        </div>

        {/* Pending Transactions Alert */}
        <div className="card bg-orange-50 border-l-4 border-warning">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-md flex-1">
              <div className="text-3xl">💰</div>
              <div className="flex-1">
                <div className="flex items-center gap-sm mb-xs">
                  <h3 className="text-section-header font-bold">Pending Transactions</h3>
                  <span className="bg-warning text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                    3
                  </span>
                </div>
                <p className="text-sm text-gray-700">3 expense reports awaiting approval</p>
              </div>
            </div>
            <Link to="/transactions" className="btn-primary bg-warning hover:bg-orange-600 text-white whitespace-nowrap">
              Review Now
            </Link>
          </div>
        </div>
      </div>

      {/* TODAY'S OVERVIEW SECTION */}
      <div>
        <h2 className="text-section-header mb-md flex items-center gap-sm">
          <span>📊</span> Today's Overview
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          {/* Today's Attendance */}
          <div className="card">
            <h3 className="text-section-header mb-md">Guard Attendance</h3>
            <p className="text-sm text-gray-600 mb-md">Today - {currentDate}</p>
            <div className="space-y-sm mb-md">
              <div className="flex justify-between items-center">
                <span className="text-sm">✅ Present</span>
                <span className="font-semibold text-secondary-600">106 (85%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">❌ Absent</span>
                <span className="font-semibold text-error">15 (12%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">⏰ Late</span>
                <span className="font-semibold text-warning">4 (3%)</span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-md">
              <div className="h-full flex">
                <div className="bg-secondary-500" style={{ width: '85%' }}></div>
                <div className="bg-error" style={{ width: '12%' }}></div>
                <div className="bg-warning" style={{ width: '3%' }}></div>
              </div>
            </div>
            <Link to="/attendance" className="text-blue-600 text-sm font-medium hover:underline">
              View Details →
            </Link>
          </div>

          {/* Today's Meetings */}
          <div className="card">
            <h3 className="text-section-header mb-md flex items-center gap-sm">
              <span>📅</span> Upcoming Meetings
            </h3>
            <div className="space-y-sm mb-md">
              <div className="p-sm bg-blue-50 rounded-md">
                <p className="text-sm font-medium">Weekly Team Meeting</p>
                <p className="text-xs text-gray-600">3:00 PM</p>
              </div>
              <div className="p-sm bg-blue-50 rounded-md">
                <p className="text-sm font-medium">Manager Review</p>
                <p className="text-xs text-gray-600">4:30 PM</p>
              </div>
            </div>
            <Link to="/meetings" className="text-blue-600 text-sm font-medium hover:underline">
              View All Meetings →
            </Link>
          </div>

          {/* Active Polls */}
          <div className="card">
            <h3 className="text-section-header mb-md flex items-center gap-sm">
              <span>📋</span> Active Polls
            </h3>
            <div className="space-y-md mb-md">
              <div>
                <p className="text-sm font-medium mb-xs">Monthly Satisfaction Survey</p>
                <div className="flex justify-between text-xs text-gray-600 mb-xs">
                  <span>28/45 responses</span>
                  <span>62%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary-500" style={{ width: '62%' }}></div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-xs">Schedule Preferences</p>
                <div className="flex justify-between text-xs text-gray-600 mb-xs">
                  <span>15/30 responses</span>
                  <span>50%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500" style={{ width: '50%' }}></div>
                </div>
              </div>
            </div>
            <Link to="/polls" className="text-blue-600 text-sm font-medium hover:underline">
              View All Polls →
            </Link>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS SECTION */}
      <div>
        <h2 className="text-section-header mb-md flex items-center gap-sm">
          <span>⚡</span> Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
          <Link to="/managers/register" className="btn-primary bg-primary-500 hover:bg-primary-600 text-gray-900 flex-col h-24 justify-center">
            <UserPlusIcon className="icon-lg mb-xs" />
            <span>Register Manager</span>
          </Link>
          <Link to="/messages/new" className="btn-secondary flex-col h-24 justify-center">
            <PaperAirplaneIcon className="icon-lg mb-xs" />
            <span>Send Message</span>
          </Link>
          <Link to="/meetings/create" className="btn-success flex-col h-24 justify-center">
            <CalendarIcon className="icon-lg mb-xs" />
            <span>Create Meeting</span>
          </Link>
          <Link to="/polls/create" className="btn-primary bg-primary-500 hover:bg-primary-600 text-gray-900 flex-col h-24 justify-center">
            <DocumentPlusIcon className="icon-lg mb-xs" />
            <span>Create Poll</span>
          </Link>
        </div>
      </div>

      {/* RECENT ACTIVITY SECTION */}
      <div>
        <h2 className="text-section-header mb-md flex items-center gap-sm">
          <span>🕐</span> Recent Activity
        </h2>
        <div className="space-y-sm">
          <div className="card border-l-4 border-secondary-500 flex items-center gap-md">
            <div className="text-2xl">👤</div>
            <div className="flex-1">
              <p className="text-sm font-medium">John Doe registered as Supervisor</p>
              <p className="text-xs text-gray-600">2 hours ago • Requested by Manager Smith</p>
            </div>
            <span className="badge badge-success">Approved</span>
          </div>

          <div className="card border-l-4 border-blue-500 flex items-center gap-md">
            <div className="text-2xl">📧</div>
            <div className="flex-1">
              <p className="text-sm font-medium">Important Notice sent to All Managers</p>
              <p className="text-xs text-gray-600">5 hours ago • 45 recipients • Delivered</p>
            </div>
          </div>

          <div className="card border-l-4 border-secondary-500 flex items-center gap-md">
            <div className="text-2xl">💰</div>
            <div className="flex-1">
              <p className="text-sm font-medium">Guard Payroll - North Division</p>
              <p className="text-xs text-gray-600">Yesterday • $12,500.00</p>
            </div>
            <span className="badge badge-success">Approved</span>
          </div>
        </div>
        <div className="text-center mt-md">
          <Link to="/activity" className="text-blue-600 text-sm font-medium hover:underline">
            View All Activity →
          </Link>
        </div>
      </div>

      {/* PERSONNEL BY ROLE SECTION */}
      <div>
        <h2 className="text-section-header mb-md flex items-center gap-sm">
          <span>👥</span> Personnel by Role
        </h2>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-md">
          {[
            { number: 18, label: 'Managers', icon: '👔', bg: 'bg-blue-50', color: 'text-blue-600' },
            { number: 32, label: 'Supervisors', icon: '👤', bg: 'bg-secondary-50', color: 'text-secondary-600' },
            { number: 8, label: 'HR', icon: '📋', bg: 'bg-primary-50', color: 'text-primary-700' },
            { number: 12, label: 'Secretaries', icon: '📝', bg: 'bg-purple-50', color: 'text-purple-600' },
            { number: 165, label: 'Guards', icon: '🛡️', bg: 'bg-orange-50', color: 'text-orange-600' },
            { number: 10, label: 'Gen. Supervisors', icon: '👥', bg: 'bg-blue-50', color: 'text-blue-600' },
          ].map((item, index) => (
            <div key={index} className={`card ${item.bg} text-center`}>
              <div className="text-3xl mb-xs">{item.icon}</div>
              <p className={`text-2xl font-bold ${item.color} mb-xs`}>{item.number}</p>
              <p className="text-xs text-gray-700">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* NOTIFICATIONS PREVIEW SECTION */}
      <div>
        <div className="flex items-center justify-between mb-md">
          <h2 className="text-section-header flex items-center gap-sm">
            <span>🔔</span> Recent Notifications
            <span className="bg-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              8
            </span>
          </h2>
        </div>
        <div className="space-y-sm">
          <div className="card bg-red-50 flex items-center gap-md">
            <div className="text-xl text-error">⚠️</div>
            <div className="flex-1">
              <p className="text-sm font-semibold">5 registration requests need approval</p>
              <p className="text-xs text-gray-600">30 minutes ago</p>
            </div>
          </div>

          <div className="card bg-blue-50 flex items-center gap-md">
            <div className="text-xl text-blue-600">📊</div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Monthly Satisfaction Survey - 62% response rate</p>
              <p className="text-xs text-gray-600">2 hours ago</p>
            </div>
          </div>

          <div className="card bg-secondary-50 flex items-center gap-md">
            <div className="text-xl text-secondary-600">📅</div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Weekly Team Meeting starts in 30 minutes</p>
              <p className="text-xs text-gray-600">Just now</p>
            </div>
          </div>
        </div>
        <div className="text-center mt-md">
          <Link to="/notifications" className="text-blue-600 text-sm font-medium hover:underline">
            View All Notifications →
          </Link>
        </div>
      </div>

      {/* SYSTEM STATUS */}
      <div className="card bg-secondary-50 border-l-4 border-secondary-500">
        <div className="flex items-center gap-md">
          <span className="text-2xl">✅</span>
          <p className="text-sm font-medium text-secondary-700">All Systems Operational</p>
        </div>
      </div>
    </div>
  );
}
