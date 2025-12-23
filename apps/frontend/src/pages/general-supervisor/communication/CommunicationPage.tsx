import { useState, useEffect } from 'react';
import {
  Search,
  Send,
  Users,
  Bell,
  Clock,
  ChevronDown,
  RefreshCw,
  Inbox,
  Megaphone,
  Calendar,
  AlertCircle,
  Paperclip,
  Star
} from 'lucide-react';

interface Message {
  id: string;
  from: {
    id: string;
    name: string;
    type: 'manager' | 'supervisor' | 'system';
    avatar: string | null;
  };
  to: string;
  subject: string;
  preview: string;
  content: string;
  timestamp: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  priority: 'high' | 'normal' | 'low';
  hasAttachment: boolean;
  type: 'message' | 'announcement' | 'meeting' | 'alert';
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  priority: 'high' | 'normal';
  expiresAt: string | null;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  organizer: string;
  attendees: string[];
  status: 'upcoming' | 'completed' | 'cancelled';
}

// Mock data
const mockMessages: Message[] = [
  {
    id: 'msg-001',
    from: { id: 'mgr-001', name: 'Robert Manager', type: 'manager', avatar: null },
    to: 'General Supervisor',
    subject: 'Monthly Performance Review Meeting',
    preview: 'Please prepare the monthly performance reports for all supervisors...',
    content: 'Please prepare the monthly performance reports for all supervisors under your management. We will be reviewing these in our meeting next Monday.',
    timestamp: '10:30 AM',
    date: '2025-01-20',
    isRead: false,
    isStarred: true,
    priority: 'high',
    hasAttachment: true,
    type: 'message'
  },
  {
    id: 'msg-002',
    from: { id: 'sup-001', name: 'John Smith', type: 'supervisor', avatar: null },
    to: 'General Supervisor',
    subject: 'Request for Additional Staff - Downtown Office',
    preview: 'Due to increased workload, we need 2 additional operators...',
    content: 'Due to increased workload at Downtown Office, we need 2 additional operators for the morning shift. Please advise.',
    timestamp: '09:15 AM',
    date: '2025-01-20',
    isRead: false,
    isStarred: false,
    priority: 'normal',
    hasAttachment: false,
    type: 'message'
  },
  {
    id: 'msg-003',
    from: { id: 'sys', name: 'System', type: 'system', avatar: null },
    to: 'General Supervisor',
    subject: 'Alert: Understaffed Location - North Mall',
    preview: 'North Mall is currently understaffed. Only 2 of 6 required operators...',
    content: 'North Mall is currently understaffed. Only 2 of 6 required operators are present. Immediate attention required.',
    timestamp: '08:00 AM',
    date: '2025-01-20',
    isRead: true,
    isStarred: false,
    priority: 'high',
    hasAttachment: false,
    type: 'alert'
  },
  {
    id: 'msg-004',
    from: { id: 'sup-002', name: 'Sarah Johnson', type: 'supervisor', avatar: null },
    to: 'General Supervisor',
    subject: 'Incident Report Follow-up',
    preview: 'Following up on the incident report from yesterday...',
    content: 'Following up on the incident report from yesterday. The investigation is complete and the report has been filed with the police.',
    timestamp: '04:30 PM',
    date: '2025-01-19',
    isRead: true,
    isStarred: false,
    priority: 'normal',
    hasAttachment: true,
    type: 'message'
  },
  {
    id: 'msg-005',
    from: { id: 'mgr-001', name: 'Robert Manager', type: 'manager', avatar: null },
    to: 'General Supervisor',
    subject: 'New Security Protocol Update',
    preview: 'Please review the attached new security protocol and ensure all supervisors...',
    content: 'Please review the attached new security protocol and ensure all supervisors are trained on it by end of this week.',
    timestamp: '02:00 PM',
    date: '2025-01-19',
    isRead: true,
    isStarred: true,
    priority: 'high',
    hasAttachment: true,
    type: 'message'
  }
];

const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-001',
    title: 'System Maintenance Scheduled',
    content: 'The system will be down for maintenance on Saturday, January 25th from 2:00 AM to 6:00 AM.',
    author: 'IT Department',
    date: '2025-01-20',
    priority: 'high',
    expiresAt: '2025-01-26'
  },
  {
    id: 'ann-002',
    title: 'New Uniform Policy',
    content: 'All security personnel are required to wear the new uniforms starting February 1st.',
    author: 'HR Department',
    date: '2025-01-18',
    priority: 'normal',
    expiresAt: null
  },
  {
    id: 'ann-003',
    title: 'Holiday Schedule',
    content: 'Please submit your holiday shift preferences by January 30th.',
    author: 'Robert Manager',
    date: '2025-01-15',
    priority: 'normal',
    expiresAt: '2025-01-30'
  }
];

const mockMeetings: Meeting[] = [
  {
    id: 'mtg-001',
    title: 'Monthly Performance Review',
    date: '2025-01-27',
    time: '10:00 AM',
    duration: '1 hour',
    location: 'Conference Room A',
    organizer: 'Robert Manager',
    attendees: ['General Supervisors', 'All Supervisors'],
    status: 'upcoming'
  },
  {
    id: 'mtg-002',
    title: 'Security Protocol Training',
    date: '2025-01-24',
    time: '02:00 PM',
    duration: '2 hours',
    location: 'Training Room',
    organizer: 'Training Department',
    attendees: ['All Supervisors'],
    status: 'upcoming'
  },
  {
    id: 'mtg-003',
    title: 'Weekly Sync',
    date: '2025-01-20',
    time: '09:00 AM',
    duration: '30 minutes',
    location: 'Virtual - Teams',
    organizer: 'Robert Manager',
    attendees: ['General Supervisors'],
    status: 'completed'
  }
];

export default function CommunicationPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose' | 'announcements' | 'meetings'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Compose state
  const [composeTo, setComposeTo] = useState<string>('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeMessage, setComposeMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setMessages(mockMessages);
      setAnnouncements(mockAnnouncements);
      setMeetings(mockMeetings);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.from.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || 
      (filterType === 'unread' && !msg.isRead) ||
      (filterType === 'starred' && msg.isStarred) ||
      (filterType === 'high' && msg.priority === 'high');
    return matchesSearch && matchesType;
  });

  const unreadCount = messages.filter(m => !m.isRead).length;

  const toggleStar = (messageId: string) => {
    setMessages(messages.map(m => 
      m.id === messageId ? { ...m, isStarred: !m.isStarred } : m
    ));
  };

  const markAsRead = (messageId: string) => {
    setMessages(messages.map(m => 
      m.id === messageId ? { ...m, isRead: true } : m
    ));
  };

  const handleSendMessage = () => {
    // In real app, this would send to API
    alert('Message sent successfully!');
    setComposeTo('');
    setComposeSubject('');
    setComposeMessage('');
    setActiveTab('inbox');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Communication</h1>
          <p className="text-gray-600">Messages, announcements, and meetings</p>
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
              <Inbox size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Megaphone size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Announcements</p>
              <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{meetings.filter(m => m.status === 'upcoming').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Bell size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">{messages.filter(m => m.priority === 'high' && !m.isRead).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {[
              { key: 'inbox', label: 'Inbox', icon: Inbox, badge: unreadCount },
              { key: 'compose', label: 'Compose', icon: Send },
              { key: 'announcements', label: 'Announcements', icon: Megaphone },
              { key: 'meetings', label: 'Meetings', icon: Calendar }
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
                {tab.badge && tab.badge > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Inbox Tab */}
          {activeTab === 'inbox' && (
            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="all">All Messages</option>
                    <option value="unread">Unread</option>
                    <option value="starred">Starred</option>
                    <option value="high">High Priority</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Messages List */}
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                {filteredMessages.map((message) => (
                  <div 
                    key={message.id}
                    onClick={() => {
                      setSelectedMessage(message);
                      markAsRead(message.id);
                    }}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !message.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                        message.from.type === 'manager' 
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
                          : message.from.type === 'system'
                            ? 'bg-gradient-to-br from-gray-500 to-gray-600'
                            : 'bg-gradient-to-br from-blue-500 to-blue-600'
                      }`}>
                        {message.from.type === 'system' ? <Bell size={18} /> : message.from.name.split(' ').map(n => n[0]).join('')}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${!message.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {message.from.name}
                            </span>
                            {message.priority === 'high' && (
                              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded">High</span>
                            )}
                            {message.hasAttachment && (
                              <Paperclip size={14} className="text-gray-400" />
                            )}
                          </div>
                          <span className="text-sm text-gray-500">{message.timestamp}</span>
                        </div>
                        <p className={`text-sm ${!message.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {message.subject}
                        </p>
                        <p className="text-sm text-gray-500 truncate mt-1">{message.preview}</p>
                      </div>

                      {/* Actions */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(message.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Star 
                          size={18} 
                          className={message.isStarred ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} 
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredMessages.length === 0 && (
                <div className="text-center py-12">
                  <Inbox size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          )}

          {/* Compose Tab */}
          {activeTab === 'compose' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <select
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select recipient...</option>
                  <option value="all_supervisors">All Supervisors</option>
                  <option value="sup-001">John Smith (Supervisor)</option>
                  <option value="sup-002">Sarah Johnson (Supervisor)</option>
                  <option value="sup-003">Michael Williams (Supervisor)</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Enter subject..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <button className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Paperclip size={18} />
                  Attach File
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!composeTo || !composeSubject || !composeMessage}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                  Send Message
                </button>
              </div>
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div 
                  key={announcement.id}
                  className={`p-4 border rounded-lg ${
                    announcement.priority === 'high' ? 'border-red-200 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {announcement.priority === 'high' && (
                        <AlertCircle size={18} className="text-red-600" />
                      )}
                      <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                    </div>
                    <span className="text-sm text-gray-500">{announcement.date}</span>
                  </div>
                  <p className="text-gray-600 mb-2">{announcement.content}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>By: {announcement.author}</span>
                    {announcement.expiresAt && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        Expires: {announcement.expiresAt}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {announcements.length === 0 && (
                <div className="text-center py-12">
                  <Megaphone size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements</h3>
                  <p className="text-gray-500">There are no active announcements</p>
                </div>
              )}
            </div>
          )}

          {/* Meetings Tab */}
          {activeTab === 'meetings' && (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <div 
                  key={meeting.id}
                  className={`p-4 border rounded-lg ${
                    meeting.status === 'upcoming' ? 'border-blue-200 bg-blue-50' : 
                    meeting.status === 'cancelled' ? 'border-red-200 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        meeting.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                        meeting.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-gray-500 block">Date</span>
                      <span className="font-medium text-gray-900">{meeting.date}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Time</span>
                      <span className="font-medium text-gray-900">{meeting.time}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Duration</span>
                      <span className="font-medium text-gray-900">{meeting.duration}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Location</span>
                      <span className="font-medium text-gray-900">{meeting.location}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-sm">
                    <span className="text-gray-500">Organizer: </span>
                    <span className="font-medium text-gray-900">{meeting.organizer}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Users size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{meeting.attendees.join(', ')}</span>
                  </div>
                </div>
              ))}

              {meetings.length === 0 && (
                <div className="text-center py-12">
                  <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings</h3>
                  <p className="text-gray-500">There are no scheduled meetings</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedMessage.subject}</h2>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <span>From: {selectedMessage.from.name}</span>
                    <span>•</span>
                    <span>{selectedMessage.date} at {selectedMessage.timestamp}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.content}</p>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setActiveTab('compose');
                  setSelectedMessage(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
