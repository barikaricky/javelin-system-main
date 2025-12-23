import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Settings2,
  Shield,
  Bell,
  Mic,
  Camera,
  Monitor,
  ChevronDown,
  ChevronUp,
  Plus,
  CheckCircle,
  Info,
  Lock,
  Repeat,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { meetingService } from '../../../services/meetingService';
import type {
  CreateMeetingInput,
} from '../../../types/meeting';
import {
  MEETING_TYPE_LABELS,
  MEETING_CATEGORY_LABELS,
  RECURRING_PATTERN_LABELS,
  DAYS_OF_WEEK,
} from '../../../types/meeting';

// User roles for targeting
const USER_ROLES = [
  { value: 'DIRECTOR', label: 'Directors' },
  { value: 'MANAGER', label: 'Managers' },
  { value: 'GENERAL_SUPERVISOR', label: 'General Supervisors' },
  { value: 'SUPERVISOR', label: 'Supervisors' },
  { value: 'OPERATOR', label: 'Operators' },
  { value: 'SECRETARY', label: 'Secretaries' },
];

// Duration options
const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
];

// Timezone options
const TIMEZONE_OPTIONS = [
  { value: 'Africa/Lagos', label: 'WAT (Lagos) - UTC+1' },
  { value: 'Africa/Nairobi', label: 'EAT (Nairobi) - UTC+3' },
  { value: 'Africa/Johannesburg', label: 'SAST (Johannesburg) - UTC+2' },
  { value: 'Europe/London', label: 'GMT (London) - UTC+0/+1' },
  { value: 'America/New_York', label: 'EST (New York) - UTC-5/-4' },
];

export default function CreateMeetingPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    scheduling: true,
    participants: false,
    access: false,
    recording: false,
    reminders: false,
    advanced: false,
  });

  // Form state
  const [formData, setFormData] = useState<CreateMeetingInput>({
    title: '',
    description: '',
    scheduledTime: '',
    duration: 60,
    meetingType: 'VIDEO_CONFERENCE',
    category: 'GENERAL',
    agenda: '',
    recordingEnabled: false,
    autoStartRecording: false,
    maxParticipants: 100,
    targetRoles: [],
    targetUserIds: [],
    allowGuestAccess: false,
    isRecurring: false,
    recurringPattern: undefined,
    recurringEndDate: undefined,
    recurringDays: [],
    timezone: 'Africa/Lagos',
    requirePassword: false,
    meetingPassword: '',
    waitingRoomEnabled: false,
    allowJoinBeforeHost: true,
    joinBeforeHostMinutes: 5,
    muteParticipantsOnEntry: false,
    disableParticipantVideo: false,
    allowScreenSharing: true,
    allowChat: true,
    allowRaiseHand: true,
    allowReactions: true,
    customReminderMinutes: undefined,
  });

  // Device test state
  const [deviceTest, setDeviceTest] = useState({
    camera: false,
    microphone: false,
    speaker: false,
  });

  // Set minimum date/time to now
  const now = new Date();
  const minDateTime = now.toISOString().slice(0, 16);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value,
    }));
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      targetRoles: prev.targetRoles?.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...(prev.targetRoles || []), role],
    }));
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      recurringDays: prev.recurringDays?.includes(day)
        ? prev.recurringDays.filter(d => d !== day)
        : [...(prev.recurringDays || []), day],
    }));
  };

  const testDevice = async (device: 'camera' | 'microphone' | 'speaker') => {
    try {
      if (device === 'camera' || device === 'microphone') {
        const constraints = device === 'camera' 
          ? { video: true } 
          : { audio: true };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        stream.getTracks().forEach(track => track.stop());
        
        setDeviceTest(prev => ({ ...prev, [device]: true }));
        toast.success(`${device.charAt(0).toUpperCase() + device.slice(1)} is working!`);
      } else {
        // For speaker, just play a test sound
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 440;
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          audioContext.close();
        }, 500);
        
        setDeviceTest(prev => ({ ...prev, speaker: true }));
        toast.success('Speaker is working!');
      }
    } catch (error) {
      toast.error(`Failed to access ${device}. Please check permissions.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Meeting title is required');
      return;
    }
    
    if (!formData.scheduledTime) {
      toast.error('Please select a date and time');
      return;
    }

    const scheduledDate = new Date(formData.scheduledTime);
    if (scheduledDate < new Date()) {
      toast.error('Meeting cannot be scheduled in the past');
      return;
    }

    setIsSubmitting(true);
    try {
      await meetingService.createMeeting(formData);
      toast.success('Meeting created successfully!');
      navigate('/director/meetings/list');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Section Header Component
  const SectionHeader = ({
    title,
    icon: Icon,
    section,
    description,
  }: {
    title: string;
    icon: any;
    section: keyof typeof expandedSections;
    description?: string;
  }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="w-5 h-5 text-gray-400" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-400" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Video className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Create New Meeting</h1>
          </div>
          <p className="text-blue-100">
            Set up a professional video meeting with all the features you need
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <SectionHeader
            title="Basic Information"
            icon={FileText}
            section="basic"
            description="Meeting title, description, and type"
          />
          
          {expandedSections.basic && (
            <div className="p-6 space-y-4 border-t">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Weekly Team Standup"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the meeting..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Meeting Type & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Type
                  </label>
                  <select
                    name="meetingType"
                    value={formData.meetingType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(MEETING_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(MEETING_CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Agenda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agenda / Outline
                </label>
                <textarea
                  name="agenda"
                  value={formData.agenda}
                  onChange={handleInputChange}
                  placeholder="1. Opening remarks&#10;2. Review previous action items&#10;3. Main discussion&#10;4. Q&A&#10;5. Closing"
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Scheduling */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <SectionHeader
            title="Schedule & Duration"
            icon={Calendar}
            section="scheduling"
            description="When and how long the meeting will be"
          />
          
          {expandedSections.scheduling && (
            <div className="p-6 space-y-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date/Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduledTime"
                    value={formData.scheduledTime}
                    onChange={handleInputChange}
                    min={minDateTime}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {DURATION_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TIMEZONE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recurring Meeting */}
              <div className="border-t pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isRecurring"
                    checked={formData.isRecurring}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <Repeat className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-700">Make this a recurring meeting</span>
                  </div>
                </label>

                {formData.isRecurring && (
                  <div className="mt-4 ml-8 space-y-4 p-4 bg-blue-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Repeat
                        </label>
                        <select
                          name="recurringPattern"
                          value={formData.recurringPattern || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          <option value="">Select pattern</option>
                          {Object.entries(RECURRING_PATTERN_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          name="recurringEndDate"
                          value={formData.recurringEndDate || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                      </div>
                    </div>

                    {formData.recurringPattern === 'WEEKLY' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Repeat on
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {DAYS_OF_WEEK.map(day => (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => handleDayToggle(day.value)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                formData.recurringDays?.includes(day.value)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {day.label.slice(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Participants */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <SectionHeader
            title="Participants"
            icon={Users}
            section="participants"
            description="Who should be invited to this meeting"
          />
          
          {expandedSections.participants && (
            <div className="p-6 space-y-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Participants
                </label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  min={2}
                  max={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">Maximum allowed: 500 participants</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite by Role
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Select roles to automatically invite all users with those roles
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {USER_ROLES.map(role => (
                    <label
                      key={role.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.targetRoles?.includes(role.value)
                          ? 'bg-blue-50 border-blue-500'
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.targetRoles?.includes(role.value) || false}
                        onChange={() => handleRoleToggle(role.value)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{role.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  name="allowGuestAccess"
                  checked={formData.allowGuestAccess}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-700">Allow Guest Access</span>
                  <p className="text-sm text-gray-500">
                    External users can join with the meeting link
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Access & Security */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <SectionHeader
            title="Access & Security"
            icon={Shield}
            section="access"
            description="Password protection and waiting room settings"
          />
          
          {expandedSections.access && (
            <div className="p-6 space-y-4 border-t">
              {/* Password */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="requirePassword"
                    checked={formData.requirePassword}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-700">Require meeting password</span>
                  </div>
                </label>

                {formData.requirePassword && (
                  <div className="mt-3 ml-8">
                    <input
                      type="text"
                      name="meetingPassword"
                      value={formData.meetingPassword}
                      onChange={handleInputChange}
                      placeholder="Enter meeting password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              {/* Waiting Room */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Enable Waiting Room</span>
                    <p className="text-sm text-gray-500">
                      Participants wait until you admit them
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="waitingRoomEnabled"
                  checked={formData.waitingRoomEnabled}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              {/* Allow join before host */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-700">Allow Join Before Host</span>
                  <p className="text-sm text-gray-500">
                    Participants can join before you start the meeting
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="allowJoinBeforeHost"
                  checked={formData.allowJoinBeforeHost}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              {formData.allowJoinBeforeHost && (
                <div className="ml-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minutes before scheduled time
                  </label>
                  <select
                    name="joinBeforeHostMinutes"
                    value={formData.joinBeforeHostMinutes}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recording */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <SectionHeader
            title="Recording"
            icon={Video}
            section="recording"
            description="Record and save the meeting"
          />
          
          {expandedSections.recording && (
            <div className="p-6 space-y-4 border-t">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Video className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Enable Recording</span>
                    <p className="text-sm text-gray-500">
                      Save the meeting for later viewing
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="recordingEnabled"
                  checked={formData.recordingEnabled}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              {formData.recordingEnabled && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg ml-4">
                  <div>
                    <span className="font-medium text-gray-700">Auto-start Recording</span>
                    <p className="text-sm text-gray-500">
                      Automatically start recording when the meeting begins
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    name="autoStartRecording"
                    checked={formData.autoStartRecording}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reminders */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <SectionHeader
            title="Reminders"
            icon={Bell}
            section="reminders"
            description="Notification settings for participants"
          />
          
          {expandedSections.reminders && (
            <div className="p-6 space-y-4 border-t">
              <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                <Info className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-700">
                  Default reminders: 15 minutes and 1 hour before the meeting
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Reminder (optional)
                </label>
                <select
                  name="customReminderMinutes"
                  value={formData.customReminderMinutes || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No custom reminder</option>
                  <option value={5}>5 minutes before</option>
                  <option value={10}>10 minutes before</option>
                  <option value={30}>30 minutes before</option>
                  <option value={120}>2 hours before</option>
                  <option value={1440}>1 day before</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Advanced Settings */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <SectionHeader
            title="Advanced Settings"
            icon={Settings2}
            section="advanced"
            description="Audio, video, and participant controls"
          />
          
          {expandedSections.advanced && (
            <div className="p-6 space-y-4 border-t">
              <h4 className="font-medium text-gray-700">Participant Controls</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Mute participants on entry</span>
                  </div>
                  <input
                    type="checkbox"
                    name="muteParticipantsOnEntry"
                    checked={formData.muteParticipantsOnEntry}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Disable participant video</span>
                  </div>
                  <input
                    type="checkbox"
                    name="disableParticipantVideo"
                    checked={formData.disableParticipantVideo}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Allow screen sharing</span>
                  </div>
                  <input
                    type="checkbox"
                    name="allowScreenSharing"
                    checked={formData.allowScreenSharing}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💬</span>
                    <span className="text-sm text-gray-700">Allow chat</span>
                  </div>
                  <input
                    type="checkbox"
                    name="allowChat"
                    checked={formData.allowChat}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✋</span>
                    <span className="text-sm text-gray-700">Allow raise hand</span>
                  </div>
                  <input
                    type="checkbox"
                    name="allowRaiseHand"
                    checked={formData.allowRaiseHand}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👏</span>
                    <span className="text-sm text-gray-700">Allow reactions</span>
                  </div>
                  <input
                    type="checkbox"
                    name="allowReactions"
                    checked={formData.allowReactions}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Device Test */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-700 mb-3">Test Your Devices</h4>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => testDevice('camera')}
                    className={`p-4 rounded-lg border text-center transition-colors ${
                      deviceTest.camera
                        ? 'bg-green-50 border-green-500'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Camera className={`w-6 h-6 mx-auto mb-2 ${deviceTest.camera ? 'text-green-600' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium">Camera</span>
                    {deviceTest.camera && (
                      <CheckCircle className="w-4 h-4 text-green-600 mx-auto mt-1" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => testDevice('microphone')}
                    className={`p-4 rounded-lg border text-center transition-colors ${
                      deviceTest.microphone
                        ? 'bg-green-50 border-green-500'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Mic className={`w-6 h-6 mx-auto mb-2 ${deviceTest.microphone ? 'text-green-600' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium">Microphone</span>
                    {deviceTest.microphone && (
                      <CheckCircle className="w-4 h-4 text-green-600 mx-auto mt-1" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => testDevice('speaker')}
                    className={`p-4 rounded-lg border text-center transition-colors ${
                      deviceTest.speaker
                        ? 'bg-green-50 border-green-500'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl block mb-2">🔊</span>
                    <span className="text-sm font-medium">Speaker</span>
                    {deviceTest.speaker && (
                      <CheckCircle className="w-4 h-4 text-green-600 mx-auto mt-1" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/director/meetings/list')}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Create Meeting
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
