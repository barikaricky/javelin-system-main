import mongoose, { Schema, Document } from 'mongoose';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  LOCATION = 'LOCATION',
  VOICE_NOTE = 'VOICE_NOTE',
  SYSTEM = 'SYSTEM',
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content?: string;
  messageType: MessageType;
  status: MessageStatus;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
  thumbnailUrl?: string;
  replyToId?: mongoose.Types.ObjectId;
  forwardedFromId?: mongoose.Types.ObjectId;
  isPinned: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedForAll: boolean;
  isHighPriority: boolean;
  isEmergency: boolean;
  metadata?: any;
  reactions?: any;
  readBy?: any;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: String,
    messageType: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
    },
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.SENT,
    },
    attachmentUrl: String,
    attachmentName: String,
    attachmentSize: Number,
    attachmentType: String,
    thumbnailUrl: String,
    replyToId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    forwardedFromId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedForAll: {
      type: Boolean,
      default: false,
    },
    isHighPriority: {
      type: Boolean,
      default: false,
    },
    isEmergency: {
      type: Boolean,
      default: false,
    },
    metadata: Schema.Types.Mixed,
    reactions: Schema.Types.Mixed,
    readBy: Schema.Types.Mixed,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ isDeleted: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
