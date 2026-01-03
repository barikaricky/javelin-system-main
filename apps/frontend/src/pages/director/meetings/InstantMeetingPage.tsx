import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Zap, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../stores/authStore';
import { meetingService } from '../../../services/meetingService';

const roleOptions = [
  { value: 'SUPERVISOR', label: 'Supervisors' },
  { value: 'GENERAL_SUPERVISOR', label: 'General Supervisors' },
  { value: 'MANAGER', label: 'Managers' },
  { value: 'SECRETARY', label: 'Secretaries' },
  { value: 'ALL', label: 'All Staff' },
];

export default function InstantMeetingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['ALL']);

  const toggleRole = (role: string) => {
    if (role === 'ALL') {
      setSelectedRoles(['ALL']);
      return;
    }

    const next = selectedRoles.includes(role)
      ? selectedRoles.filter(r => r !== role)
      : [...selectedRoles.filter(r => r !== 'ALL'), role];

    setSelectedRoles(next.length === 0 ? ['ALL'] : next);
  };

  const startInstantMeeting = async () => {
    if (!title.trim()) {
      toast.error('Please enter a meeting title');
      return;
    }

    setIsCreating(true);

    try {
      // Create meeting that starts immediately
      const response = await meetingService.createMeeting({
        title: title.trim(),
        description: 'Emergency/Instant Meeting',
        scheduledTime: new Date().toISOString(), // Start immediately
        duration: 120, // Default 2 hours
        meetingType: 'VIDEO_CONFERENCE',
        category: 'EMERGENCY',
        targetRoles: selectedRoles.includes('ALL') ? [] : selectedRoles,
      });

      // Start the meeting immediately
      const startedMeeting = await meetingService.startMeeting(response.meeting.id);

      toast.success('Instant meeting started! Opening meeting room...');
      
      // Open the in-app meeting room so the user name carries over and you can control participants
      const meetingLink = startedMeeting.meetingLink || response.meeting.meetingLink;
      if (meetingLink) {
        const meetingRoomUrl = `/meeting/${meetingLink}`;
        // Navigate to meeting room instead of opening in new tab
        navigate(meetingRoomUrl);
      } else {
        throw new Error('Meeting link not generated');
      }
    } catch (error: any) {
      console.error('Failed to start instant meeting:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to start meeting';
      toast.error(errorMsg);
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2 text-sm font-medium"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Start Instant Meeting</h1>
          </div>
          <p className="text-gray-600">
            Create and start an emergency meeting immediately without scheduling
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
          {/* Info Banner */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-1">Emergency Meeting</h3>
                <p className="text-sm text-orange-700">
                  This meeting will start immediately. Share the link with participants to join instantly.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Meeting Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Emergency Security Briefing"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isCreating}
              />
              <p className="text-xs text-gray-500 mt-1">
                Give your meeting a clear, descriptive title
              </p>
            </div>

            {/* Organizer Info */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Organizer</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Meeting Details */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                <Video className="w-4 h-4" />
                Meeting Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Start Time:</span>
                  <span className="font-medium text-blue-900">Immediately</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Duration:</span>
                  <span className="font-medium text-blue-900">2 hours (default)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Type:</span>
                  <span className="font-medium text-blue-900">Emergency Meeting</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Participants:</span>
                  <span className="font-medium text-blue-900">
                    {selectedRoles.includes('ALL')
                      ? 'All staff (open)'
                      : selectedRoles
                          .map(role => roleOptions.find(r => r.value === role)?.label)
                          .filter(Boolean)
                          .join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Audience Selection */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Who can join?</h3>
              <p className="text-xs text-gray-500 mb-3">Select the roles you want to invite to this instant meeting.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roleOptions.map(option => {
                  const checked = selectedRoles.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition ${
                        checked ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-gray-200 text-gray-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="accent-blue-600"
                        checked={checked}
                        onChange={() => toggleRole(option.value)}
                        disabled={isCreating && !checked}
                      />
                      <span className="text-sm font-medium">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                onClick={startInstantMeeting}
                disabled={isCreating || !title.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Start Meeting Now
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">How it works:</h4>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Enter a meeting title and click "Start Meeting Now"</li>
              <li>The meeting will start immediately in a new window</li>
              <li>Copy and share the meeting link with participants</li>
              <li>Participants can join instantly using the link</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
