import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Plus,
  Search,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Eye,
  Trash2,
  RefreshCw,
  Calendar,
  TrendingUp,
  Pause,
  Play,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { pollService } from '../../../services/pollService';
import type { Poll, PollStats } from '../../../types/poll';

export default function ActivePollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [stats, setStats] = useState<PollStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');
  const [showMenu, setShowMenu] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pollsData, statsData] = await Promise.all([
        pollService.getAllPolls(),
        pollService.getPollStats(),
      ]);
      setPolls(pollsData || []);
      setStats(statsData || null);
    } catch (error) {
      console.error('Failed to load polls:', error);
      // Show empty state when API fails
      setPolls([]);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePoll = async (pollId: string) => {
    try {
      await pollService.closePoll(pollId);
      toast.success('Poll closed successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to close poll');
    }
    setShowMenu(null);
  };

  const handleReactivatePoll = async (pollId: string) => {
    try {
      await pollService.reactivatePoll(pollId);
      toast.success('Poll reactivated successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to reactivate poll');
    }
    setShowMenu(null);
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }
    try {
      await pollService.deletePoll(pollId);
      toast.success('Poll deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to delete poll');
    }
    setShowMenu(null);
  };

  const filteredPolls = polls.filter((poll) => {
    const matchesSearch = poll.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !filterRole || poll.targetRole === filterRole || (!poll.targetRole && filterRole === 'ALL');
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && poll.status === 'ACTIVE') ||
      (filterStatus === 'expired' && (poll.status === 'CLOSED' || poll.status === 'ARCHIVED'));
    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleOptions = [
    { value: '', label: 'All Audiences' },
    { value: 'ALL', label: 'All Users' },
    { value: 'MANAGER', label: 'Managers' },
    { value: 'GENERAL_SUPERVISOR', label: 'General Supervisors' },
    { value: 'SUPERVISOR', label: 'Supervisors' },
    { value: 'OPERATOR', label: 'Operators' },
    { value: 'SECRETARY', label: 'Secretaries' },
  ];

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Less than 1h remaining';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading polls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Active Polls</h1>
                <p className="text-indigo-200 mt-1">Manage and monitor your organization polls</p>
              </div>
            </div>
            <Link
              to="/director/polls/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Poll
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.totalPolls || 0}</span>
            </div>
            <p className="text-sm text-gray-600 mt-3">Total Polls</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.activePolls || 0}</span>
            </div>
            <p className="text-sm text-gray-600 mt-3">Active Polls</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.totalResponses || 0}</span>
            </div>
            <p className="text-sm text-gray-600 mt-3">Total Responses</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {stats?.averageResponseRate || 0}%
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-3">Avg Response Rate</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search polls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <div className="flex bg-gray-100 rounded-xl p-1">
                {['all', 'active', 'expired'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                      filterStatus === status
                        ? 'bg-white text-indigo-600 shadow'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Polls List */}
        {filteredPolls.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No polls found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterRole || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first poll to gather feedback from your team'}
            </p>
            <Link
              to="/director/polls/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              Create First Poll
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPolls.map((poll) => (
              <div
                key={poll.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {poll.question}
                        </h3>
                        {poll.isMandatory && (
                          <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Mandatory
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            poll.isActive
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {poll.isActive ? 'Active' : 'Closed'}
                        </span>
                      </div>
                      {poll.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{poll.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {poll.targetRole
                            ? roleOptions.find((r) => r.value === poll.targetRole)?.label
                            : 'All Users'}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          {poll.options?.length || 0} options
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {poll.responseCount || poll.totalVotes || 0} responses
                        </span>
                        {poll.expiresAt && (
                          <span
                            className={`flex items-center gap-1 ${
                              new Date(poll.expiresAt) < new Date() ? 'text-red-500' : ''
                            }`}
                          >
                            <Clock className="w-4 h-4" />
                            {getTimeRemaining(poll.expiresAt)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Created {new Date(poll.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/director/polls/results/${poll.id}`}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100 transition-all flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Results
                      </Link>
                      <div className="relative">
                        <button
                          onClick={() => setShowMenu(showMenu === poll.id ? null : poll.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>
                        {showMenu === poll.id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-10">
                            {poll.isActive ? (
                              <button
                                onClick={() => handleClosePoll(poll.id)}
                                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Pause className="w-4 h-4" />
                                Close Poll
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReactivatePoll(poll.id)}
                                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Play className="w-4 h-4" />
                                Reactivate
                              </button>
                            )}
                            <button
                              onClick={() => handleDeletePoll(poll.id)}
                              className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Poll
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Options Preview */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                      {(poll.options || []).slice(0, 4).map((option) => (
                        <span
                          key={option.id}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          {option.text || option.optionText}
                        </span>
                      ))}
                      {(poll.options?.length || 0) > 4 && (
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-sm rounded-full">
                          +{(poll.options?.length || 0) - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowMenu(null)} />
      )}
    </div>
  );
}
