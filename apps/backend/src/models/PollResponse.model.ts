import mongoose, { Schema, Document } from 'mongoose';

export interface IPollResponse extends Document {
  pollId: mongoose.Types.ObjectId;
  optionId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  textResponse?: string;
  scaleValue?: number;
  createdAt: Date;
}

const PollResponseSchema = new Schema<IPollResponse>(
  {
    pollId: {
      type: Schema.Types.ObjectId,
      ref: 'Poll',
      required: true,
    },
    optionId: {
      type: Schema.Types.ObjectId,
      ref: 'PollOption',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    textResponse: String,
    scaleValue: Number,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

PollResponseSchema.index({ pollId: 1, userId: 1 }, { unique: true });
PollResponseSchema.index({ pollId: 1 });
PollResponseSchema.index({ userId: 1 });

export const PollResponse = mongoose.model<IPollResponse>('PollResponse', PollResponseSchema);
