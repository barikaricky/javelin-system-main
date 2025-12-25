import mongoose, { Schema, Document } from 'mongoose';

export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
  BROADCAST = 'BROADCAST',
  EMERGENCY = 'EMERGENCY',
}

export interface IConversation extends Document {
  name?: string;
  type: ConversationType;
  description?: string;
  avatar?: string;
  createdById: mongoose.Types.ObjectId;
  isActive: boolean;
  isPinned: boolean;
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  settings?: any;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    name: String,
    type: {
      type: String,
      enum: Object.values(ConversationType),
      default: ConversationType.DIRECT,
    },
    description: String,
    avatar: String,
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    lastMessageAt: Date,
    lastMessagePreview: String,
    settings: Schema.Types.Mixed,
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

ConversationSchema.index({ createdById: 1 });
ConversationSchema.index({ type: 1 });
ConversationSchema.index({ lastMessageAt: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
