import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  senderId?: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  type: string;
  subject?: string;
  message: string;
  isRead: boolean;
  sentAt?: Date;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  viewCount: number;
  maxViews: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    subject: String,
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    sentAt: Date,
    entityType: String,
    entityId: String,
    actionUrl: String,
    viewCount: {
      type: Number,
      default: 0,
    },
    maxViews: {
      type: Number,
      default: 3,
    },
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

NotificationSchema.index({ receiverId: 1, isRead: 1 });
NotificationSchema.index({ entityType: 1, entityId: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
