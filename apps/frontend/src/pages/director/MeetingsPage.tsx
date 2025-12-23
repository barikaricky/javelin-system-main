import { useState } from 'react';
import { 
  Video, Users, Calendar, Clock, Search, Filter, X, Check, Play
} from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePhoto: string | null;
  department?: string;
}

// Mock users data - This will be replaced with actual database data
const mockUsers: User[] = [
  { id: '1', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', role: 'SUPERVISOR', department: 'Operations', profilePhoto: null },
  { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', role: 'OPERATOR', department: 'Security', profilePhoto: null },
  { id: '3', firstName: 'Mike', lastName: 'Johnson', email: 'mike.j@example.com', role: 'SUPERVISOR', department: 'Management', profilePhoto: null },
  { id: '4', firstName: 'Sarah', lastName: 'Williams', email: 'sarah.w@example.com', role: 'SECRETARY', department: 'Admin', profilePhoto: null },
  { id: '5', firstName: 'David', lastName: 'Brown', email: 'david.b@example.com', role: 'OPERATOR', department: 'Security', profilePhoto: null },
];

export default function MeetingsPage() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [inMeeting, setInMeeting] = useState(false);

  const roles = ['ALL', 'DIRECTOR', 'SUPERVISOR', 'OPERATOR', 'SECRETARY'];

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'ALL' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleScheduleMeeting = async () => {
    if (!meetingTitle || !meetingDate || !meetingTime || selectedUsers.length === 0) {
      alert('Please fill all fields and select at least one participant');
      return;
    }

    setIsScheduling(true);
    
    // Here you would integrate with 8x8/Jitsi API to create a meeting room
    // For now, we'll simulate the process
    setTimeout(() => {
      alert(`Meeting "${meetingTitle}" scheduled with ${selectedUsers.length} participants`);
      setIsScheduling(false);
      // Reset form
      setMeetingTitle('');
      setMeetingDate('');
      setMeetingTime('');
      setSelectedUsers([]);
      setShowUserSelector(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Video className="w-8 h-8 text-primary-600" />
            Meetings
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Schedule and manage video conferences with your team
          </p>
        </div>

        {inMeeting ? (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <Video className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Meeting Room</h3>
                <p className="text-gray-600 mb-4">
                  Use instant meetings or scheduled meetings to start 8x8/Jitsi video conferences
                </p>
                <button
                  onClick={() => setInMeeting(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Meetings
                </button>
              </div>
            </div>
            
            {/* Participants Sidebar */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                Participants ({selectedUsers.length + 1})
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 bg-primary-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
                    MD
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">You (Host)</p>
                    <p className="text-xs text-gray-500">Managing Director</p>
                  </div>
                </div>
                {selectedUsers.map(userId => {
                  const user = mockUsers.find(u => u.id === userId);
                  return user ? (
                    <div key={userId} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-sm font-bold">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Meeting Setup Form */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Meeting Details Card */}
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  Meeting Details
                </h2>

                <div className="space-y-4">
                  {/* Meeting Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Title
                    </label>
                    <input
                      type="text"
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                      placeholder="e.g., Weekly Team Sync"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time
                      </label>
                      <input
                        type="time"
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Select Participants Button */}
                  <button
                    onClick={() => setShowUserSelector(!showUserSelector)}
                    className="w-full bg-gradient-to-r from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200 text-primary-900 font-semibold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 border-2 border-primary-200"
                  >
                    <Users className="w-5 h-5" />
                    {selectedUsers.length > 0 
                      ? `${selectedUsers.length} Participant${selectedUsers.length > 1 ? 's' : ''} Selected`
                      : 'Select Participants'}
                  </button>

                  {/* Selected Users Preview */}
                  {selectedUsers.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Selected Participants:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUsers.map(userId => {
                          const user = mockUsers.find(u => u.id === userId);
                          return user ? (
                            <span
                              key={userId}
                              className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm border border-gray-200"
                            >
                              {user.firstName} {user.lastName}
                              <button
                                onClick={() => toggleUserSelection(userId)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handleScheduleMeeting}
                      disabled={isScheduling || !meetingTitle || !meetingDate || !meetingTime || selectedUsers.length === 0}
                      className="w-full bg-gradient-to-r from-secondary-400 to-secondary-600 hover:from-secondary-500 hover:to-secondary-700 text-white font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-5 h-5" />
                      {isScheduling ? 'Scheduling...' : 'Schedule Later'}
                    </button>
                    
                    <button
                      onClick={() => setInMeeting(true)}
                      disabled={selectedUsers.length === 0}
                      className="w-full bg-gradient-to-r from-primary-400 to-primary-600 hover:from-primary-500 hover:to-primary-700 text-dark-900 font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Play className="w-5 h-5" />
                      Start Now
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 8x8/Jitsi Video Integration Info */}
            <div className="lg:col-span-1 bg-gradient-to-br from-dark-900 to-dark-800 rounded-xl shadow-lg p-4 sm:p-6 text-white">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Video className="w-5 h-5 text-primary-400" />
                Powered by 8x8 (Jitsi)
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                Free, secure video conferencing with HD quality, unlimited duration, and no time limits.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <div className="text-primary-400 font-bold text-xl">HD</div>
                  <div className="text-xs text-gray-300 mt-1">Video Quality</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <div className="text-primary-400 font-bold text-xl">∞</div>
                  <div className="text-xs text-gray-300 mt-1">No Limits</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm col-span-2 sm:col-span-1">
                  <div className="text-primary-400 font-bold text-xl">100+</div>
                  <div className="text-xs text-gray-300 mt-1">Participants</div>
                </div>
              </div>
            </div>

            {/* User Selection Panel */}
            <div className="lg:col-span-1">
              <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all ${showUserSelector ? 'block' : 'hidden lg:block'}`}>
                <div className="bg-gradient-to-r from-dark-900 to-dark-800 px-4 py-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Select Participants
                  </h3>
                  <button
                    onClick={() => setShowUserSelector(false)}
                    className="lg:hidden text-white hover:text-primary-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Role Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Filter className="w-4 h-4" />
                      Filter by Role
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {roles.map(role => (
                        <button
                          key={role}
                          onClick={() => setFilterRole(role)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            filterRole === role
                              ? 'bg-primary-400 text-dark-900'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Users List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
                        <div
                          key={user.id}
                          onClick={() => toggleUserSelection(user.id)}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedUsers.includes(user.id)
                              ? 'border-primary-400 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {user.firstName} {user.lastName}
                                </p>
                                {selectedUsers.includes(user.id) && (
                                  <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 truncate">{user.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                  {user.role}
                                </span>
                                {user.department && (
                                  <span className="text-xs text-gray-500">{user.department}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No users found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Meetings */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" />
            Upcoming Meetings
          </h2>
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No upcoming meetings scheduled</p>
            <p className="text-sm text-gray-400 mt-1">Schedule your first meeting above</p>
          </div>
        </div>
      </div>
    </div>
  );
}
