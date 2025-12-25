import mongoose, { Schema, Document } from 'mongoose';

export interface IConversationParticipant extends Document {
  conversationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: string;
  joinedAt: Date;
  leftAt?: Date;
  isMuted: boolean;
  isPinned: boolean;
  isBlocked: boolean;
  unreadCount: number;
  lastReadAt?: Date;
  lastReadMessageId?: string;
  notificationSettings?: any;
}

const ConversationParticipantSchema = new Schema<IConversationParticipant>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      default: 'MEMBER',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: Date,
    isMuted: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    lastReadAt: Date,
    lastReadMessageId: String,
    notificationSettings: Schema.Types.Mixed,
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

ConversationParticipantSchema.index({ conversationId: 1, userId: 1 }, { unique: true });
ConversationParticipantSchema.index({ userId: 1 });
ConversationParticipantSchema.index({ conversationId: 1 });

export const ConversationParticipant = mongoose.model<IConversationParticipant>(
  'ConversationParticipant',
  ConversationParticipantSchema
);
