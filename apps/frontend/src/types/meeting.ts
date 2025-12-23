// Meeting Types and Interfaces

export type MeetingStatus = 'SCHEDULED' | 'WAITING' | 'LIVE' | 'ENDED' | 'CANCELLED';

export type MeetingType = 
  | 'VIDEO_CONFERENCE'
  | 'WEBINAR'
  | 'TRAINING'
  | 'INTERVIEW'
  | 'ONE_ON_ONE'
  | 'TOWN_HALL'
  | 'BOARD_MEETING';

export type MeetingCategory = 
  | 'GENERAL'
  | 'TEAM_STANDUP'
  | 'PROJECT_REVIEW'
  | 'PERFORMANCE'
  | 'CLIENT_CALL'
  | 'DEPARTMENT'
  | 'EMERGENCY'
  | 'SOCIAL';

export type ParticipantStatus = 'INVITED' | 'ACCEPTED' | 'DECLINED' | 'JOINED' | 'LEFT';

export type ParticipantRole = 'HOST' | 'CO_HOST' | 'PARTICIPANT';

export type RecurringPattern = 'DAILY' | 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY';

export type RecordingStatus = 'PROCESSING' | 'READY' | 'FAILED' | 'DELETED';

export type ReminderType = 'EMAIL' | 'PUSH' | 'SMS';

export interface MeetingOrganizer {
  id: string;
  userId: string;
  name: string;
  email?: string;
  profilePhoto?: string | null;
}

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  userId: string;
  status: ParticipantStatus;
  joinedAt?: string | null;
  leftAt?: string | null;
  role: ParticipantRole;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing?: boolean;
  isHandRaised?: boolean;
  totalTimeInMeeting?: number | null;
  invitationSentAt?: string | null;
  responseAt?: string | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePhoto?: string | null;
    role: string;
  };
}

export interface MeetingRecording {
  id: string;
  meetingId: string;
  muxAssetId: string;
  muxPlaybackId: string;
  duration?: number | null;
  fileSize?: number | null;
  status: RecordingStatus;
  downloadUrl?: string | null;
  thumbnailUrl?: string | null;
  title?: string | null;
  isPublic: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingAttendance {
  id: string;
  meetingId: string;
  userId: string;
  userName?: string | null;
  userRole?: string | null;
  joinedAt: string;
  leftAt?: string | null;
  duration?: number | null;
  joinCount: number;
  deviceType?: string | null;
  browserInfo?: string | null;
  wasKicked: boolean;
  kickedReason?: string | null;
}

export interface MeetingFile {
  id: string;
  meetingId: string;
  uploadedById: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number | null;
  description?: string | null;
  isAgenda: boolean;
  uploadedAt: string;
}

export interface MeetingChatMessage {
  id: string;
  meetingId: string;
  userId: string;
  userName?: string | null;
  message: string;
  messageType: 'TEXT' | 'FILE' | 'EMOJI' | 'SYSTEM' | 'QUESTION' | 'POLL';
  fileUrl?: string | null;
  fileName?: string | null;
  isPinned: boolean;
  isPrivate: boolean;
  replyToId?: string | null;
  createdAt: string;
}

export interface MeetingReminder {
  id: string;
  meetingId: string;
  userId: string;
  reminderType: ReminderType;
  minutesBefore: number;
  sentAt?: string | null;
  status: 'PENDING' | 'SENT' | 'FAILED';
}

export interface Meeting {
  id: string;
  title: string;
  description?: string | null;
  meetingLink: string;
  videoUrl?: string | null; // 8x8/Jitsi video conference URL
  joinUrl: string;
  scheduledTime: string;
  duration: number;
  endTime?: string | null;
  status: MeetingStatus;
  meetingType: MeetingType;
  category: MeetingCategory;
  agenda?: string | null;
  
  // Mux Integration
  muxSpaceId?: string | null;
  muxBroadcastId?: string | null;
  muxPlaybackId?: string | null;
  recordingUrl?: string | null;
  
  // Recording Settings
  recordingEnabled: boolean;
  autoStartRecording: boolean;
  
  // Participant Settings
  maxParticipants: number;
  targetRoles: string[];
  targetUserIds: string[];
  allowGuestAccess: boolean;
  
  // Scheduling & Recurrence
  isRecurring: boolean;
  recurringPattern?: string | null;
  recurringEndDate?: string | null;
  recurringDays: string[];
  parentMeetingId?: string | null;
  timezone: string;
  
  // Access & Security
  requirePassword: boolean;
  waitingRoomEnabled: boolean;
  allowJoinBeforeHost: boolean;
  joinBeforeHostMinutes: number;
  
  // Meeting Controls
  muteParticipantsOnEntry: boolean;
  disableParticipantVideo: boolean;
  allowScreenSharing: boolean;
  allowChat: boolean;
  allowRaiseHand: boolean;
  allowReactions: boolean;
  
  // Reminders
  customReminderMinutes?: number | null;
  
  // Files & Attachments
  attachments?: any[] | null;
  
  // Notes & Summary
  meetingNotes?: string | null;
  aiSummary?: string | null;
  actionItems?: any[] | null;
  
  // Actual timing
  startedAt?: string | null;
  endedAt?: string | null;
  actualDuration?: number | null;
  
  // Cancellation
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  
  // Relations
  organizer: MeetingOrganizer | null;
  participants: MeetingParticipant[];
  participantCount: number;
  recordings: MeetingRecording[];
  files?: MeetingFile[];
  attendance?: MeetingAttendance[];
  hasRecording: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Create Meeting Input
export interface CreateMeetingInput {
  title: string;
  description?: string;
  scheduledTime: string;
  duration?: number;
  meetingType?: MeetingType;
  category?: MeetingCategory;
  agenda?: string;
  recordingEnabled?: boolean;
  autoStartRecording?: boolean;
  maxParticipants?: number;
  targetRoles?: string[];
  targetUserIds?: string[];
  allowGuestAccess?: boolean;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  recurringEndDate?: string;
  recurringDays?: string[];
  timezone?: string;
  requirePassword?: boolean;
  meetingPassword?: string;
  waitingRoomEnabled?: boolean;
  allowJoinBeforeHost?: boolean;
  joinBeforeHostMinutes?: number;
  muteParticipantsOnEntry?: boolean;
  disableParticipantVideo?: boolean;
  allowScreenSharing?: boolean;
  allowChat?: boolean;
  allowRaiseHand?: boolean;
  allowReactions?: boolean;
  customReminderMinutes?: number;
  attachments?: File[];
}

// Update Meeting Input
export interface UpdateMeetingInput {
  title?: string;
  description?: string;
  scheduledTime?: string;
  duration?: number;
  meetingType?: MeetingType;
  category?: MeetingCategory;
  agenda?: string;
  recordingEnabled?: boolean;
  autoStartRecording?: boolean;
  maxParticipants?: number;
  targetRoles?: string[];
  targetUserIds?: string[];
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  recurringEndDate?: string;
  recurringDays?: string[];
  requirePassword?: boolean;
  meetingPassword?: string;
  waitingRoomEnabled?: boolean;
  allowJoinBeforeHost?: boolean;
  joinBeforeHostMinutes?: number;
  muteParticipantsOnEntry?: boolean;
  disableParticipantVideo?: boolean;
  allowScreenSharing?: boolean;
  allowChat?: boolean;
  allowRaiseHand?: boolean;
  allowReactions?: boolean;
  customReminderMinutes?: number;
  attachments?: any[];
  meetingNotes?: string;
  actionItems?: any[];
  status?: MeetingStatus;
}

// Meeting Filters
export interface MeetingFilters {
  status?: MeetingStatus | MeetingStatus[];
  meetingType?: MeetingType;
  category?: MeetingCategory;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Meeting Statistics
export interface MeetingStats {
  total: number;
  scheduled: number;
  live: number;
  ended: number;
  cancelled: number;
  upcoming: number;
  withRecordings: number;
  averageDuration: number;
  totalParticipants: number;
}

// Pagination Response
export interface MeetingPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Responses
export interface GetMeetingsResponse {
  meetings: Meeting[];
  pagination: MeetingPagination;
}

export interface CreateMeetingResponse {
  success: boolean;
  meeting: Meeting;
}

export interface JoinMeetingResponse {
  meeting: Meeting;
  participant: MeetingParticipant;
  isHost: boolean;
  muxSpaceId?: string | null;
  spaceJwt?: string | null;
}

// Display Helpers
export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  VIDEO_CONFERENCE: 'Video Conference',
  WEBINAR: 'Webinar',
  TRAINING: 'Training Session',
  INTERVIEW: 'Interview',
  ONE_ON_ONE: '1:1 Meeting',
  TOWN_HALL: 'Town Hall',
  BOARD_MEETING: 'Board Meeting',
};

export const MEETING_CATEGORY_LABELS: Record<MeetingCategory, string> = {
  GENERAL: 'General',
  TEAM_STANDUP: 'Team Standup',
  PROJECT_REVIEW: 'Project Review',
  PERFORMANCE: 'Performance Review',
  CLIENT_CALL: 'Client Call',
  DEPARTMENT: 'Department Meeting',
  EMERGENCY: 'Emergency',
  SOCIAL: 'Social/Team Building',
};

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  SCHEDULED: 'Scheduled',
  WAITING: 'Waiting Room',
  LIVE: 'Live',
  ENDED: 'Ended',
  CANCELLED: 'Cancelled',
};

export const MEETING_STATUS_COLORS: Record<MeetingStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  WAITING: 'bg-yellow-100 text-yellow-800',
  LIVE: 'bg-green-100 text-green-800',
  ENDED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export const RECURRING_PATTERN_LABELS: Record<RecurringPattern, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BI_WEEKLY: 'Bi-Weekly',
  MONTHLY: 'Monthly',
};

export const DAYS_OF_WEEK = [
  { value: 'MON', label: 'Monday' },
  { value: 'TUE', label: 'Tuesday' },
  { value: 'WED', label: 'Wednesday' },
  { value: 'THU', label: 'Thursday' },
  { value: 'FRI', label: 'Friday' },
  { value: 'SAT', label: 'Saturday' },
  { value: 'SUN', label: 'Sunday' },
];

// Utility functions
export const formatMeetingDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  return `${hours} hr${hours > 1 ? 's' : ''} ${remainingMinutes} min`;
};

export const getMeetingStatusIcon = (status: MeetingStatus): string => {
  switch (status) {
    case 'SCHEDULED': return '📅';
    case 'WAITING': return '⏳';
    case 'LIVE': return '🔴';
    case 'ENDED': return '✅';
    case 'CANCELLED': return '❌';
    default: return '📅';
  }
};

export const isMeetingJoinable = (meeting: Meeting): boolean => {
  const now = new Date();
  const scheduledTime = new Date(meeting.scheduledTime);
  const joinableFrom = new Date(scheduledTime);
  joinableFrom.setMinutes(joinableFrom.getMinutes() - meeting.joinBeforeHostMinutes);
  
  return (
    (meeting.status === 'SCHEDULED' || meeting.status === 'LIVE' || meeting.status === 'WAITING') &&
    (now >= joinableFrom || meeting.allowJoinBeforeHost)
  );
};

export const getMeetingTimeStatus = (meeting: Meeting): 'past' | 'now' | 'upcoming' => {
  const now = new Date();
  const scheduledTime = new Date(meeting.scheduledTime);
  const endTime = meeting.endTime ? new Date(meeting.endTime) : new Date(scheduledTime.getTime() + meeting.duration * 60000);
  
  if (meeting.status === 'LIVE') return 'now';
  if (now > endTime || meeting.status === 'ENDED') return 'past';
  if (now < scheduledTime) return 'upcoming';
  return 'now';
};
