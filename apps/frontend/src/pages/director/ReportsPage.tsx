import { FileText, Download, Calendar, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary-600" />
            Reports
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            View and download system reports
          </p>
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-primary-700" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Report</h3>
            <p className="text-sm text-gray-600 mb-4">Overview of team and individual performance metrics</p>
            <button className="w-full bg-gradient-to-r from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200 text-primary-900 font-medium px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Generate Report
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-secondary-700" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Attendance Report</h3>
            <p className="text-sm text-gray-600 mb-4">Worker attendance and shift completion records</p>
            <button className="w-full bg-gradient-to-r from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200 text-primary-900 font-medium px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Generate Report
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-blue-700" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial Report</h3>
            <p className="text-sm text-gray-600 mb-4">Expense tracking and payroll summaries</p>
            <button className="w-full bg-gradient-to-r from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200 text-primary-900 font-medium px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h2>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Generated</h3>
            <p className="text-gray-500">Generate your first report from the categories above</p>
          </div>
        </div>
      </div>
    </div>
  );
}
