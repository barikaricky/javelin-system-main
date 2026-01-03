import { api } from '../lib/api';
import type {
  Meeting,
  MeetingStats,
  MeetingFilters,
  CreateMeetingInput,
  UpdateMeetingInput,
  GetMeetingsResponse,
  CreateMeetingResponse,
  JoinMeetingResponse,
  MeetingParticipant,
  MeetingRecording,
  MeetingAttendance,
  MeetingFile,
  MeetingChatMessage,
} from '../types/meeting';

const MEETING_API = '/meetings';

// ==================== CRUD ====================

export const createMeeting = async (data: CreateMeetingInput): Promise<CreateMeetingResponse> => {
  const response = await api.post<CreateMeetingResponse>(MEETING_API, data);
  return response.data;
};

export const getMeetings = async (filters?: MeetingFilters): Promise<GetMeetingsResponse> => {
  const params: Record<string, string> = {};
  
  if (filters?.status) {
    params.status = Array.isArray(filters.status) ? filters.status.join(',') : filters.status;
  }
  if (filters?.meetingType) params.meetingType = filters.meetingType;
  if (filters?.category) params.category = filters.category;
  if (filters?.startDate) params.startDate = filters.startDate;
  if (filters?.endDate) params.endDate = filters.endDate;
  if (filters?.search) params.search = filters.search;
  if (filters?.page) params.page = filters.page.toString();
  if (filters?.limit) params.limit = filters.limit.toString();

  const response = await api.get<GetMeetingsResponse>(MEETING_API, { params });
  return response.data;
};

export const getMeetingById = async (meetingId: string): Promise<Meeting> => {
  const response = await api.get<{ meeting: Meeting }>(`${MEETING_API}/${meetingId}`);
  return response.data.meeting;
};

export const getMeetingByLink = async (meetingLink: string): Promise<{meeting: Meeting; canJoin?: boolean; isOrganizer?: boolean; message?: string}> => {
  const response = await api.get<{ meeting: Meeting; canJoin?: boolean; isOrganizer?: boolean; message?: string }>(`${MEETING_API}/link/${meetingLink}`);
  return response.data;
};

export const updateMeeting = async (meetingId: string, data: UpdateMeetingInput): Promise<Meeting> => {
  const response = await api.patch<{ meeting: Meeting }>(`${MEETING_API}/${meetingId}`, data);
  return response.data.meeting;
};

export const deleteMeeting = async (meetingId: string): Promise<void> => {
  await api.delete(`${MEETING_API}/${meetingId}`);
};

// ==================== QUERIES ====================

export const getMeetingStats = async (startDate?: string, endDate?: string): Promise<MeetingStats> => {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await api.get<MeetingStats>(`${MEETING_API}/stats`, { params });
  return response.data;
};

export const getUpcomingMeetings = async (limit?: number): Promise<Meeting[]> => {
  const params: Record<string, string> = {};
  if (limit) params.limit = limit.toString();

  const response = await api.get<{ meetings: Meeting[] }>(`${MEETING_API}/upcoming`, { params });
  return response.data.meetings;
};

export const getOngoingMeetings = async (): Promise<Meeting[]> => {
  const response = await api.get<{ meetings: Meeting[] }>(`${MEETING_API}/ongoing`);
  return response.data.meetings;
};

export const getPastMeetings = async (page?: number, limit?: number): Promise<GetMeetingsResponse> => {
  const params: Record<string, string> = {};
  if (page) params.page = page.toString();
  if (limit) params.limit = limit.toString();

  const response = await api.get<GetMeetingsResponse>(`${MEETING_API}/past`, { params });
  return response.data;
};

export const getCancelledMeetings = async (page?: number, limit?: number): Promise<GetMeetingsResponse> => {
  const params: Record<string, string> = {};
  if (page) params.page = page.toString();
  if (limit) params.limit = limit.toString();

  const response = await api.get<GetMeetingsResponse>(`${MEETING_API}/cancelled`, { params });
  return response.data;
};

// ==================== MEETING LIFECYCLE ====================

export const startMeeting = async (meetingId: string): Promise<Meeting> => {
  const response = await api.post<{ meeting: Meeting }>(`${MEETING_API}/${meetingId}/start`);
  return response.data.meeting;
};

export const joinMeeting = async (meetingLink: string): Promise<JoinMeetingResponse> => {
  const response = await api.post<JoinMeetingResponse>(`${MEETING_API}/join/${meetingLink}`);
  return response.data;
};

export const leaveMeeting = async (meetingId: string): Promise<void> => {
  await api.post(`${MEETING_API}/${meetingId}/leave`);
};

export const endMeeting = async (meetingId: string): Promise<Meeting> => {
  const response = await api.post<{ meeting: Meeting }>(`${MEETING_API}/${meetingId}/end`);
  return response.data.meeting;
};

export const cancelMeeting = async (meetingId: string, reason?: string): Promise<Meeting> => {
  const response = await api.post<{ meeting: Meeting }>(`${MEETING_API}/${meetingId}/cancel`, { reason });
  return response.data.meeting;
};

export const enableWaitingRoom = async (meetingId: string): Promise<Meeting> => {
  const response = await api.post<{ meeting: Meeting }>(`${MEETING_API}/${meetingId}/waiting-room`);
  return response.data.meeting;
};

// ==================== PARTICIPANTS ====================

export const getParticipants = async (meetingId: string): Promise<MeetingParticipant[]> => {
  const response = await api.get<{ participants: MeetingParticipant[] }>(`${MEETING_API}/${meetingId}/participants`);
  return response.data.participants;
};

export const addParticipants = async (meetingId: string, userIds: string[]): Promise<MeetingParticipant[]> => {
  const response = await api.post<{ participants: MeetingParticipant[] }>(`${MEETING_API}/${meetingId}/participants`, { userIds });
  return response.data.participants;
};

export const removeParticipant = async (meetingId: string, participantId: string): Promise<void> => {
  await api.delete(`${MEETING_API}/${meetingId}/participants/${participantId}`);
};

export const updateParticipantStatus = async (
  meetingId: string,
  userId: string,
  status: string
): Promise<MeetingParticipant> => {
  const response = await api.patch<{ participant: MeetingParticipant }>(
    `${MEETING_API}/${meetingId}/participants/${userId}/status`,
    { status }
  );
  return response.data.participant;
};

export const updateParticipantRole = async (
  meetingId: string,
  userId: string,
  role: string
): Promise<MeetingParticipant> => {
  const response = await api.patch<{ participant: MeetingParticipant }>(
    `${MEETING_API}/${meetingId}/participants/${userId}/role`,
    { role }
  );
  return response.data.participant;
};

export const toggleParticipantMute = async (
  meetingId: string,
  userId: string,
  isMuted: boolean
): Promise<MeetingParticipant> => {
  const response = await api.patch<{ participant: MeetingParticipant }>(
    `${MEETING_API}/${meetingId}/participants/${userId}/mute`,
    { isMuted }
  );
  return response.data.participant;
};

export const toggleParticipantVideo = async (
  meetingId: string,
  userId: string,
  isVideoOn: boolean
): Promise<MeetingParticipant> => {
  const response = await api.patch<{ participant: MeetingParticipant }>(
    `${MEETING_API}/${meetingId}/participants/${userId}/video`,
    { isVideoOn }
  );
  return response.data.participant;
};

// ==================== CHAT ====================

export const getChatMessages = async (
  meetingId: string,
  limit?: number,
  before?: string
): Promise<MeetingChatMessage[]> => {
  const params: Record<string, string> = {};
  if (limit) params.limit = limit.toString();
  if (before) params.before = before;

  const response = await api.get<{ messages: MeetingChatMessage[] }>(
    `${MEETING_API}/${meetingId}/chat`,
    { params }
  );
  return response.data.messages;
};

export const sendChatMessage = async (
  meetingId: string,
  message: string,
  messageType?: string,
  fileUrl?: string,
  fileName?: string,
  isPrivate?: boolean
): Promise<MeetingChatMessage> => {
  const response = await api.post<{ message: MeetingChatMessage }>(
    `${MEETING_API}/${meetingId}/chat`,
    { message, messageType, fileUrl, fileName, isPrivate }
  );
  return response.data.message;
};

export const pinChatMessage = async (
  meetingId: string,
  messageId: string,
  isPinned: boolean
): Promise<MeetingChatMessage> => {
  const response = await api.patch<{ message: MeetingChatMessage }>(
    `${MEETING_API}/${meetingId}/chat/${messageId}/pin`,
    { isPinned }
  );
  return response.data.message;
};

// ==================== RECORDINGS ====================

export const getRecordings = async (meetingId: string): Promise<MeetingRecording[]> => {
  const response = await api.get<{ recordings: MeetingRecording[] }>(
    `${MEETING_API}/${meetingId}/recordings`
  );
  return response.data.recordings;
};

export const addRecording = async (
  meetingId: string,
  muxAssetId: string,
  muxPlaybackId: string,
  title?: string
): Promise<MeetingRecording> => {
  const response = await api.post<{ recording: MeetingRecording }>(
    `${MEETING_API}/${meetingId}/recordings`,
    { muxAssetId, muxPlaybackId, title }
  );
  return response.data.recording;
};

export const updateRecordingStatus = async (
  meetingId: string,
  recordingId: string,
  status: string,
  duration?: number,
  fileSize?: number,
  downloadUrl?: string,
  thumbnailUrl?: string
): Promise<MeetingRecording> => {
  const response = await api.patch<{ recording: MeetingRecording }>(
    `${MEETING_API}/${meetingId}/recordings/${recordingId}`,
    { status, duration, fileSize, downloadUrl, thumbnailUrl }
  );
  return response.data.recording;
};

export const incrementRecordingViews = async (
  meetingId: string,
  recordingId: string
): Promise<MeetingRecording> => {
  const response = await api.post<{ recording: MeetingRecording }>(
    `${MEETING_API}/${meetingId}/recordings/${recordingId}/view`
  );
  return response.data.recording;
};

// ==================== ATTENDANCE ====================

export const getAttendanceReport = async (meetingId: string): Promise<MeetingAttendance[]> => {
  const response = await api.get<{ attendance: MeetingAttendance[] }>(
    `${MEETING_API}/${meetingId}/attendance`
  );
  return response.data.attendance;
};

// ==================== FILES ====================

export const getMeetingFiles = async (meetingId: string): Promise<MeetingFile[]> => {
  const response = await api.get<{ files: MeetingFile[] }>(
    `${MEETING_API}/${meetingId}/files`
  );
  return response.data.files;
};

export const addMeetingFile = async (
  meetingId: string,
  fileName: string,
  fileUrl: string,
  fileType: string,
  fileSize?: number,
  description?: string,
  isAgenda?: boolean
): Promise<MeetingFile> => {
  const response = await api.post<{ file: MeetingFile }>(
    `${MEETING_API}/${meetingId}/files`,
    { fileName, fileUrl, fileType, fileSize, description, isAgenda }
  );
  return response.data.file;
};

export const deleteMeetingFile = async (meetingId: string, fileId: string): Promise<void> => {
  await api.delete(`${MEETING_API}/${meetingId}/files/${fileId}`);
};

// ==================== REMINDERS ====================

export const createReminder = async (
  meetingId: string,
  reminderType: string,
  minutesBefore: number
): Promise<any> => {
  const response = await api.post(`${MEETING_API}/${meetingId}/reminders`, {
    reminderType,
    minutesBefore,
  });
  return response.data.reminder;
};

// ==================== RECURRING ====================

export const getRecurringInstances = async (meetingId: string): Promise<Meeting[]> => {
  const response = await api.get<{ instances: Meeting[] }>(
    `${MEETING_API}/${meetingId}/recurring`
  );
  return response.data.instances;
};

// Export as meetingService object for convenience
export const meetingService = {
  // CRUD
  createMeeting,
  getMeetings,
  getMeetingById,
  getMeetingByLink,
  updateMeeting,
  deleteMeeting,
  
  // Queries
  getMeetingStats,
  getUpcomingMeetings,
  getOngoingMeetings,
  getPastMeetings,
  getCancelledMeetings,
  
  // Lifecycle
  startMeeting,
  joinMeeting,
  leaveMeeting,
  endMeeting,
  cancelMeeting,
  enableWaitingRoom,
  
  // Participants
  getParticipants,
  addParticipants,
  removeParticipant,
  updateParticipantStatus,
  updateParticipantRole,
  toggleParticipantMute,
  toggleParticipantVideo,
  
  // Chat
  getChatMessages,
  sendChatMessage,
  pinChatMessage,
  
  // Recordings
  getRecordings,
  addRecording,
  updateRecordingStatus,
  incrementRecordingViews,
  
  // Attendance
  getAttendanceReport,
  
  // Files
  getMeetingFiles,
  addMeetingFile,
  deleteMeetingFile,
  
  // Reminders
  createReminder,
  
  // Recurring
  getRecurringInstances,
};

export default meetingService;
