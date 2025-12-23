import mongoose, { Schema, Document } from 'mongoose';

export interface IMeetingParticipant extends Document {
  meetingId: mongoose.Types.ObjectId;
  userId: string;
  status: string;
  joinedAt?: Date;
  leftAt?: Date;
  role: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  totalTimeInMeeting?: number;
  invitationSentAt?: Date;
  responseAt?: Date;
}

const MeetingParticipantSchema = new Schema<IMeetingParticipant>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: 'INVITED',
    },
    joinedAt: Date,
    leftAt: Date,
    role: {
      type: String,
      default: 'PARTICIPANT',
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
    isVideoOn: {
      type: Boolean,
      default: true,
    },
    isScreenSharing: {
      type: Boolean,
      default: false,
    },
    isHandRaised: {
      type: Boolean,
      default: false,
    },
    totalTimeInMeeting: Number,
    invitationSentAt: Date,
    responseAt: Date,
  },
  {
    timestamps: true,
  }
);

MeetingParticipantSchema.index({ meetingId: 1, userId: 1 }, { unique: true });
MeetingParticipantSchema.index({ meetingId: 1 });
MeetingParticipantSchema.index({ userId: 1 });
MeetingParticipantSchema.index({ status: 1 });

export const MeetingParticipant = mongoose.model<IMeetingParticipant>(
  'MeetingParticipant',
  MeetingParticipantSchema
);
