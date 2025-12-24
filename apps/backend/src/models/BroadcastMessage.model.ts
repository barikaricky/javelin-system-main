import mongoose, { Schema, Document } from 'mongoose';
import { MessageType } from './Message.model';

export interface IBroadcastMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  messageType: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  targetRoles: string[];
  targetUserIds: string[];
  targetRegions: string[];
  targetGroup?: 'ALL_GS' | 'ALL_SUPERVISORS' | 'BIT_SUPERVISORS' | 'CUSTOM';
  bitId?: mongoose.Types.ObjectId;
  isEmergency: boolean;
  isActive: boolean;
  expiresAt?: Date;
  sentCount: number;
  readCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BroadcastMessageSchema = new Schema<IBroadcastMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
    },
    attachmentUrl: String,
    attachmentName: String,
    targetRoles: {
      type: [String],
      default: [],
    },
    targetUserIds: {
      type: [String],
      default: [],
    },
    targetRegions: {
      type: [String],
      default: [],
    },
    targetGroup: {
      type: String,
      enum: ['ALL_GS', 'ALL_SUPERVISORS', 'BIT_SUPERVISORS', 'CUSTOM'],
    },
    bitId: {
      type: Schema.Types.ObjectId,
      ref: 'Bit',
    },
    isEmergency: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: Date,
    sentCount: {
      type: Number,
      default: 0,
    },
    readCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

BroadcastMessageSchema.index({ senderId: 1 });
BroadcastMessageSchema.index({ isEmergency: 1 });
BroadcastMessageSchema.index({ createdAt: 1 });

export const BroadcastMessage = mongoose.model<IBroadcastMessage>(
  'BroadcastMessage',
  BroadcastMessageSchema
);
