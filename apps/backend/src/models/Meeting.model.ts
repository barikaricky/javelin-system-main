import mongoose, { Schema, Document } from 'mongoose';

export enum MeetingStatus {
  SCHEDULED = 'SCHEDULED',
  WAITING = 'WAITING',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
}

export enum MeetingType {
  VIDEO_CONFERENCE = 'VIDEO_CONFERENCE',
  WEBINAR = 'WEBINAR',
  TRAINING = 'TRAINING',
  INTERVIEW = 'INTERVIEW',
  ONE_ON_ONE = 'ONE_ON_ONE',
  TOWN_HALL = 'TOWN_HALL',
  BOARD_MEETING = 'BOARD_MEETING',
}

export enum MeetingCategory {
  GENERAL = 'GENERAL',
  TEAM_STANDUP = 'TEAM_STANDUP',
  PROJECT_REVIEW = 'PROJECT_REVIEW',
  PERFORMANCE = 'PERFORMANCE',
  CLIENT_CALL = 'CLIENT_CALL',
  DEPARTMENT = 'DEPARTMENT',
  EMERGENCY = 'EMERGENCY',
  SOCIAL = 'SOCIAL',
}

export interface IMeeting extends Document {
  organizerId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  meetingLink: string;
  videoUrl?: string; // 8x8/Jitsi video conference URL
  scheduledTime: Date;
  duration: number;
  endTime?: Date;
  status: MeetingStatus;
  meetingType: MeetingType;
  category: MeetingCategory;
  agenda?: string;
  muxSpaceId?: string;
  muxBroadcastId?: string;
  muxPlaybackId?: string;
  muxAssetId?: string;
  muxJwtSigningKeyId?: string;
  recordingEnabled: boolean;
  autoStartRecording: boolean;
  recordingUrl?: string;
  maxParticipants: number;
  targetRoles: string[];
  targetUserIds: string[];
  allowGuestAccess: boolean;
  isRecurring: boolean;
  recurringPattern?: string;
  recurringEndDate?: Date;
  recurringDays: string[];
  parentMeetingId?: mongoose.Types.ObjectId;
  timezone: string;
  requirePassword: boolean;
  meetingPassword?: string;
  waitingRoomEnabled: boolean;
  allowJoinBeforeHost: boolean;
  joinBeforeHostMinutes: number;
  muteParticipantsOnEntry: boolean;
  disableParticipantVideo: boolean;
  allowScreenSharing: boolean;
  allowChat: boolean;
  allowRaiseHand: boolean;
  allowReactions: boolean;
  reminderSent15Min: boolean;
  reminderSent1Hour: boolean;
  reminderSent1Day: boolean;
  customReminderMinutes?: number;
  attachments?: any;
  meetingNotes?: string;
  aiSummary?: string;
  actionItems?: any;
  startedAt?: Date;
  endedAt?: Date;
  actualDuration?: number;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    organizerId: {
      type: Schema.Types.ObjectId,
      ref: 'Director',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    meetingLink: {
      type: String,
      required: true,
      unique: true,
    },
    videoUrl: {
      type: String,
      // 8x8/Jitsi meeting room URL
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      default: 60,
    },
    endTime: Date,
    status: {
      type: String,
      enum: Object.values(MeetingStatus),
      default: MeetingStatus.SCHEDULED,
    },
    meetingType: {
      type: String,
      enum: Object.values(MeetingType),
      default: MeetingType.VIDEO_CONFERENCE,
    },
    category: {
      type: String,
      enum: Object.values(MeetingCategory),
      default: MeetingCategory.GENERAL,
    },
    agenda: String,
    muxSpaceId: String,
    muxBroadcastId: String,
    muxPlaybackId: String,
    muxAssetId: String,
    muxJwtSigningKeyId: String,
    recordingEnabled: {
      type: Boolean,
      default: false,
    },
    autoStartRecording: {
      type: Boolean,
      default: false,
    },
    recordingUrl: String,
    maxParticipants: {
      type: Number,
      default: 100,
    },
    targetRoles: {
      type: [String],
      default: [],
    },
    targetUserIds: {
      type: [String],
      default: [],
    },
    allowGuestAccess: {
      type: Boolean,
      default: false,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: String,
    recurringEndDate: Date,
    recurringDays: {
      type: [String],
      default: [],
    },
    parentMeetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
    },
    timezone: {
      type: String,
      default: 'Africa/Lagos',
    },
    requirePassword: {
      type: Boolean,
      default: false,
    },
    meetingPassword: String,
    waitingRoomEnabled: {
      type: Boolean,
      default: false,
    },
    allowJoinBeforeHost: {
      type: Boolean,
      default: false,
    },
    joinBeforeHostMinutes: {
      type: Number,
      default: 5,
    },
    muteParticipantsOnEntry: {
      type: Boolean,
      default: false,
    },
    disableParticipantVideo: {
      type: Boolean,
      default: false,
    },
    allowScreenSharing: {
      type: Boolean,
      default: true,
    },
    allowChat: {
      type: Boolean,
      default: true,
    },
    allowRaiseHand: {
      type: Boolean,
      default: true,
    },
    allowReactions: {
      type: Boolean,
      default: true,
    },
    reminderSent15Min: {
      type: Boolean,
      default: false,
    },
    reminderSent1Hour: {
      type: Boolean,
      default: false,
    },
    reminderSent1Day: {
      type: Boolean,
      default: false,
    },
    customReminderMinutes: Number,
    attachments: Schema.Types.Mixed,
    meetingNotes: String,
    aiSummary: String,
    actionItems: Schema.Types.Mixed,
    startedAt: Date,
    endedAt: Date,
    actualDuration: Number,
    cancelledAt: Date,
    cancellationReason: String,
  },
  {
    timestamps: true,
  }
);

MeetingSchema.index({ organizerId: 1 });
MeetingSchema.index({ scheduledTime: 1 });
MeetingSchema.index({ status: 1 });
MeetingSchema.index({ muxSpaceId: 1 });
MeetingSchema.index({ meetingType: 1 });
MeetingSchema.index({ category: 1 });
MeetingSchema.index({ parentMeetingId: 1 });

export const Meeting = mongoose.model<IMeeting>('Meeting', MeetingSchema);
