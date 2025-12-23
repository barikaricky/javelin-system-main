import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Play,
  MoreVertical,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  Copy,
  Ban,
  Eye,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { meetingService } from '../../../services/meetingService';
import type { Meeting, MeetingStats } from '../../../types/meeting';
import {
  MEETING_STATUS_LABELS,
  MEETING_STATUS_COLORS,
  MEETING_TYPE_LABELS,
  formatMeetingDuration,
  getMeetingStatusIcon,
  isMeetingJoinable,
} from '../../../types/meeting';

type TabType = 'upcoming' | 'live' | 'past' | 'cancelled';

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'upcoming', label: 'Upcoming', icon: '📅' },
  { id: 'live', label: 'Live Now', icon: '🔴' },
  { id: 'past', label: 'Past', icon: '✅' },
  { id: 'cancelled', label: 'Cancelled', icon: '❌' },
];

export default function MyMeetingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get('tab') as TabType) || 'upcoming'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<MeetingStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  useEffect(() => {
    fetchMeetings();
    fetchStats();
  }, [activeTab, pagination.page]);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  const fetchMeetings = async () => {
    setIsLoading(true);
    try {
      let result;
      
      switch (activeTab) {
        case 'upcoming':
          const upcoming = await meetingService.getUpcomingMeetings(50);
          setMeetings(upcoming);
          setPagination({ total: upcoming.length, page: 1, limit: 50, totalPages: 1 });
          break;
        case 'live':
          const live = await meetingService.getOngoingMeetings();
          setMeetings(live);
          setPagination({ total: live.length, page: 1, limit: 50, totalPages: 1 });
          break;
        case 'past':
          result = await meetingService.getPastMeetings(pagination.page, pagination.limit);
          setMeetings(result.meetings);
          setPagination(result.pagination);
          break;
        case 'cancelled':
          result = await meetingService.getCancelledMeetings(pagination.page, pagination.limit);
          setMeetings(result.meetings);
          setPagination(result.pagination);
          break;
      }
    } catch (error) {
      toast.error('Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const stats = await meetingService.getMeetingStats();
      setStats(stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleCancelMeeting = async (meetingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this meeting?')) return;
    
    try {
      await meetingService.cancelMeeting(meetingId, 'Cancelled by organizer');
      toast.success('Meeting cancelled');
      fetchMeetings();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel meeting');
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!window.confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) return;
    
    try {
      await meetingService.deleteMeeting(meetingId);
      toast.success('Meeting deleted');
      fetchMeetings();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete meeting');
    }
  };

  const handleCopyLink = (meeting: Meeting) => {
    const link = `${window.location.origin}/meeting/${meeting.meetingLink}`;
    navigator.clipboard.writeText(link);
    toast.success('Meeting link copied to clipboard');
  };

  const handleJoinMeeting = (meeting: Meeting) => {
    navigate(`/meeting/${meeting.meetingLink}`);
  };

  const handleStartMeeting = async (meeting: Meeting) => {
    try {
      await meetingService.startMeeting(meeting.id);
      navigate(`/meeting/${meeting.meetingLink}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start meeting');
    }
  };

  // Filter meetings by search query
  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeUntil = (dateString: string) => {
    const now = new Date();
    const meetingTime = new Date(dateString);
    const diff = meetingTime.getTime() - now.getTime();
    
    if (diff < 0) return 'Started';
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
    return `In ${minutes} min`;
  };

  // Meeting Card Component
  const MeetingCard = ({ meeting }: { meeting: Meeting }) => {
    const [showMenu, setShowMenu] = useState(false);
    const isJoinable = isMeetingJoinable(meeting);
    const isLive = meeting.status === 'LIVE';
    const isPast = meeting.status === 'ENDED';
    const isCancelled = meeting.status === 'CANCELLED';

    return (
      <div
        className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-shadow hover:shadow-md ${
          isLive ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-200'
        }`}
      >
        {/* Status Banner for Live Meetings */}
        {isLive && (
          <div className="bg-green-500 text-white text-center py-1 text-sm font-medium animate-pulse">
            🔴 Meeting in Progress
          </div>
        )}

        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              {/* Type Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${MEETING_STATUS_COLORS[meeting.status]}`}>
                  {getMeetingStatusIcon(meeting.status)} {MEETING_STATUS_LABELS[meeting.status]}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {MEETING_TYPE_LABELS[meeting.meetingType]}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                {meeting.title}
              </h3>

              {/* Description */}
              {meeting.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {meeting.description}
                </p>
              )}

              {/* Date/Time Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(meeting.scheduledTime)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(meeting.scheduledTime)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">•</span>
                  <span>{formatMeetingDuration(meeting.duration)}</span>
                </div>
              </div>

              {/* Participants */}
              <div className="flex items-center gap-2 mt-3">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {meeting.participantCount} participant{meeting.participantCount !== 1 ? 's' : ''}
                </span>
                {meeting.hasRecording && (
                  <span className="flex items-center gap-1 text-sm text-red-600 ml-2">
                    <Video className="w-4 h-4" />
                    Recording available
                  </span>
                )}
              </div>

              {/* Organizer */}
              {meeting.organizer && (
                <div className="flex items-center gap-2 mt-3">
                  {meeting.organizer.profilePhoto ? (
                    <img
                      src={meeting.organizer.profilePhoto}
                      alt={meeting.organizer.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {meeting.organizer.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-gray-600">
                    Hosted by {meeting.organizer.name}
                  </span>
                </div>
              )}
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-10 z-20 w-48 bg-white rounded-lg shadow-lg border py-1">
                    <button
                      onClick={() => {
                        navigate(`/director/meetings/${meeting.id}`);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        handleCopyLink(meeting);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </button>
                    {!isPast && !isCancelled && (
                      <>
                        <button
                          onClick={() => {
                            navigate(`/director/meetings/${meeting.id}/edit`);
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleCancelMeeting(meeting.id);
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Ban className="w-4 h-4" />
                          Cancel
                        </button>
                      </>
                    )}
                    {(isPast || isCancelled) && (
                      <button
                        onClick={() => {
                          handleDeleteMeeting(meeting.id);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
            {isLive && (
              <button
                onClick={() => handleJoinMeeting(meeting)}
                className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Join Now
              </button>
            )}
            
            {!isLive && !isPast && !isCancelled && (
              <>
                {isJoinable ? (
                  <button
                    onClick={() => handleStartMeeting(meeting)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Meeting
                  </button>
                ) : (
                  <span className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    {getTimeUntil(meeting.scheduledTime)}
                  </span>
                )}
              </>
            )}

            {isPast && meeting.hasRecording && (
              <button
                onClick={() => navigate(`/director/meetings/${meeting.id}/recordings`)}
                className="flex-1 sm:flex-none px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                Watch Recording
              </button>
            )}

            {isPast && (
              <button
                onClick={() => navigate(`/director/meetings/${meeting.id}/attendance`)}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Attendance
              </button>
            )}

            {isCancelled && (
              <span className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium flex items-center justify-center gap-2">
                <Ban className="w-4 h-4" />
                {meeting.cancellationReason || 'Meeting Cancelled'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Video className="w-7 h-7" />
                My Meetings
              </h1>
              <p className="text-blue-100 mt-1">Manage and join your meetings</p>
            </div>
            <button
              onClick={() => navigate('/director/meetings/create')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Meeting
            </button>
          </div>

          {/* Stats Summary */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-2xl font-bold">{stats.upcoming}</div>
                <div className="text-blue-100 text-sm">Upcoming</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-2xl font-bold flex items-center gap-1">
                  {stats.live}
                  {stats.live > 0 && (
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div className="text-blue-100 text-sm">Live Now</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-2xl font-bold">{stats.ended}</div>
                <div className="text-blue-100 text-sm">Completed</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-2xl font-bold">{stats.withRecordings}</div>
                <div className="text-blue-100 text-sm">Recordings</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.id === 'live' && stats?.live ? (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.live}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search meetings..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Filter className="w-5 h-5" />
                Filter
              </button>
              <button
                onClick={fetchMeetings}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Meeting List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab} meetings
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'upcoming'
                ? 'Schedule a new meeting to get started'
                : activeTab === 'live'
                ? 'No meetings are currently in progress'
                : activeTab === 'past'
                ? 'You have no completed meetings yet'
                : 'No cancelled meetings'}
            </p>
            {activeTab === 'upcoming' && (
              <button
                onClick={() => navigate('/director/meetings/create')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Meeting
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMeetings.map(meeting => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
