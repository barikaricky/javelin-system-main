import mongoose, { Schema, Document } from 'mongoose';

export interface IBroadcastReceipt extends Document {
  broadcastId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

const BroadcastReceiptSchema = new Schema<IBroadcastReceipt>(
  {
    broadcastId: {
      type: Schema.Types.ObjectId,
      ref: 'BroadcastMessage',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

BroadcastReceiptSchema.index({ broadcastId: 1, userId: 1 }, { unique: true });
BroadcastReceiptSchema.index({ userId: 1 });

export const BroadcastReceipt = mongoose.model<IBroadcastReceipt>(
  'BroadcastReceipt',
  BroadcastReceiptSchema
);
