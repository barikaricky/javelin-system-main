import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BarChart3,
  ArrowLeft,
  Users,
  CheckCircle,
  Clock,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  PieChart,
  Award,
  Eye,
  ChevronDown,
  User,
  Target,
  Percent,
  Search,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { pollService } from '../../../services/pollService';
import type { Poll, PollResultSummary } from '../../../types/poll';

export default function PollResultsPage() {
  const { id: pollId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State for poll list view (when no ID)
  const [polls, setPolls] = useState<Poll[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for single poll results view (when ID provided)
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResultSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOption, setExpandedOption] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    if (pollId) {
      loadResults();
    } else {
      loadAllPolls();
    }
  }, [pollId]);

  const loadAllPolls = async () => {
    setIsLoading(true);
    try {
      const pollsData = await pollService.getAllPolls();
      setPolls(pollsData || []);
    } catch (error) {
      console.error('Failed to load polls:', error);
      setPolls([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadResults = async () => {
    setIsLoading(true);
    try {
      const [pollData, resultsData] = await Promise.all([
        pollService.getPollById(pollId!),
        pollService.getPollResults(pollId!),
      ]);
      setPoll(pollData);
      setResults(resultsData);
    } catch (error) {
      console.error('Failed to load poll results:', error);
      setPoll(null);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getBarColor = (index: number) => {
    const colors = [
      'bg-gradient-to-r from-indigo-500 to-purple-500',
      'bg-gradient-to-r from-emerald-500 to-teal-500',
      'bg-gradient-to-r from-amber-500 to-orange-500',
      'bg-gradient-to-r from-pink-500 to-rose-500',
      'bg-gradient-to-r from-cyan-500 to-blue-500',
      'bg-gradient-to-r from-violet-500 to-fuchsia-500',
    ];
    return colors[index % colors.length];
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      DIRECTOR: 'bg-purple-100 text-purple-700',
      MANAGER: 'bg-blue-100 text-blue-700',
      GENERAL_SUPERVISOR: 'bg-indigo-100 text-indigo-700',
      SUPERVISOR: 'bg-teal-100 text-teal-700',
      OPERATOR: 'bg-green-100 text-green-700',
      SECRETARY: 'bg-orange-100 text-orange-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const exportResults = () => {
    if (!results || !poll) return;

    const csvContent = [
      ['Poll Results Export'],
      [''],
      ['Question:', poll.question],
      ['Description:', poll.description || 'N/A'],
      ['Total Responses:', (results.totalResponses || results.totalVotes || 0).toString()],
      [''],
      ['Option', 'Votes', 'Percentage'],
      ...(results.options || []).map((opt) => [opt.text || opt.optionText || '', (opt.responseCount || 0).toString(), `${opt.percentage}%`]),
      [''],
      ['Responses by Role'],
      ...Object.entries(results.roleBreakdown || results.responsesByRole || {}).map(([role, count]) => [role, count.toString()]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poll-results-${pollId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Results exported successfully');
  };

  // Filter polls for list view
  const filteredPolls = polls.filter((p) =>
    p.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // ============ POLL LIST VIEW (when no ID) ============
  if (!pollId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-24 lg:pb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-4 py-6 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <PieChart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Poll Results</h1>
                <p className="text-indigo-200 mt-1">View detailed analytics for all polls</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          {/* Search */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search polls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Polls List */}
          {filteredPolls.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
              <PieChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Polls Found</h3>
              <p className="text-gray-500 mb-6">
                {polls.length === 0
                  ? 'Create your first poll to start gathering feedback'
                  : 'No polls match your search criteria'}
              </p>
              <Link
                to="/director/polls/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                Create New Poll
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPolls.map((p) => (
                <Link
                  key={p.id}
                  to={`/director/polls/results/${p.id}`}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {p.question}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            p.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-600'
                              : p.status === 'CLOSED'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-yellow-100 text-yellow-600'
                          }`}
                        >
                          {p.status}
                        </span>
                        {p.isMandatory && (
                          <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                            Mandatory
                          </span>
                        )}
                      </div>
                      {p.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{p.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {p.responseCount || 0} responses
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {p.targetRole || 'All Users'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ SINGLE POLL RESULTS VIEW (when ID provided) ============
  if (!poll || !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Poll not found</h2>
          <Link
            to="/director/polls/results"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to All Polls
          </Link>
        </div>
      </div>
    );
  }

  const options = results.options || [];
  const winningOption = options.length > 0 
    ? options.reduce((a, b) => ((a.responseCount || 0) > (b.responseCount || 0) ? a : b))
    : null;
  const totalVotes = results.totalResponses || results.totalVotes || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/director/polls/results')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to All Results</span>
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <PieChart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Poll Results</h1>
                <p className="text-indigo-200 mt-1">Detailed analysis and responses</p>
              </div>
            </div>
            <button
              onClick={exportResults}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all border border-white/20"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Poll Info Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-900">{poll.question}</h2>
                  {poll.isMandatory && (
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Mandatory
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      poll.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {poll.status}
                  </span>
                </div>
                {poll.description && <p className="text-gray-600">{poll.description}</p>}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                {poll.targetRole || 'All Users'}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Created {new Date(poll.createdAt).toLocaleDateString()}
              </span>
              {poll.expiresAt && (
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {new Date(poll.expiresAt) < new Date() ? 'Expired' : 'Expires'}{' '}
                  {new Date(poll.expiresAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalVotes}</p>
            <p className="text-sm text-gray-600">Total Responses</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Percent className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{results.responseRate || 0}%</p>
            <p className="text-sm text-gray-600">Response Rate</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{options.length}</p>
            <p className="text-sm text-gray-600">Total Options</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{winningOption?.percentage || 0}%</p>
            <p className="text-sm text-gray-600 truncate" title={winningOption?.text || winningOption?.optionText || ''}>
              Leading Option
            </p>
          </div>
        </div>

        {/* Results Chart */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Response Distribution
            </h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'chart' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'
                }`}
              >
                Chart
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'table' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'
                }`}
              >
                Table
              </button>
            </div>
          </div>

          <div className="p-6">
            {options.length === 0 ? (
              <div className="text-center py-12">
                <PieChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No responses yet</p>
              </div>
            ) : viewMode === 'chart' ? (
              <div className="space-y-6">
                {options
                  .sort((a, b) => (b.responseCount || 0) - (a.responseCount || 0))
                  .map((option, index) => (
                    <div key={option.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {index === 0 && totalVotes > 0 && (
                            <Award className="w-5 h-5 text-amber-500" />
                          )}
                          <span className="font-medium text-gray-900">{option.text || option.optionText}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">{option.responseCount || 0} votes</span>
                          <span className="font-semibold text-gray-900 min-w-[60px] text-right">
                            {option.percentage || 0}%
                          </span>
                        </div>
                      </div>
                      <div className="relative h-10 bg-gray-100 rounded-xl overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 ${getBarColor(index)} rounded-xl transition-all duration-1000`}
                          style={{ width: `${option.percentage || 0}%` }}
                        />
                        <div className="absolute inset-0 flex items-center px-4">
                          {(option.percentage || 0) > 15 && (
                            <span className="text-white font-medium text-sm drop-shadow">
                              {option.percentage}%
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Expandable Voters List */}
                      {option.respondents && option.respondents.length > 0 && (
                        <>
                          <button
                            onClick={() =>
                              setExpandedOption(expandedOption === option.id ? null : option.id)
                            }
                            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 ml-auto"
                          >
                            <Eye className="w-4 h-4" />
                            View respondents ({option.respondents.length})
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${
                                expandedOption === option.id ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {expandedOption === option.id && (
                            <div className="ml-4 mt-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
                              <div className="grid gap-2 max-h-48 overflow-y-auto">
                                {option.respondents.map((respondent: { id: string; name: string; role: string }) => (
                                  <div
                                    key={respondent.id}
                                    className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-gray-100"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <User className="w-4 h-4 text-indigo-600" />
                                      </div>
                                      <span className="font-medium text-gray-900">{respondent.name}</span>
                                      <span
                                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(
                                          respondent.role
                                        )}`}
                                      >
                                        {respondent.role}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Option</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Votes</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {options
                      .sort((a, b) => (b.responseCount || 0) - (a.responseCount || 0))
                      .map((option, index) => (
                        <tr
                          key={option.id}
                          className={`border-b border-gray-100 ${
                            index === 0 ? 'bg-amber-50' : ''
                          }`}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {index === 0 && totalVotes > 0 ? (
                                <Award className="w-5 h-5 text-amber-500" />
                              ) : (
                                <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                                  {index + 1}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 font-medium text-gray-900">{option.text || option.optionText}</td>
                          <td className="py-4 px-4 text-center">{option.responseCount || 0}</td>
                          <td className="py-4 px-4 text-center">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
                              {option.percentage || 0}%
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Responses by Role */}
        {(results.roleBreakdown || results.responsesByRole) && Object.keys(results.roleBreakdown || results.responsesByRole || {}).length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Responses by Role
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(results.roleBreakdown || results.responsesByRole || {}).map(([role, count]) => (
                  <div
                    key={role}
                    className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 text-center"
                  >
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block ${getRoleBadgeColor(role)}`}>
                      {role.replace('_', ' ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
