import mongoose, { Schema, Document } from 'mongoose';

export interface IPollOption extends Document {
  pollId: mongoose.Types.ObjectId;
  optionText: string;
  orderIndex: number;
}

const PollOptionSchema = new Schema<IPollOption>(
  {
    pollId: {
      type: Schema.Types.ObjectId,
      ref: 'Poll',
      required: true,
    },
    optionText: {
      type: String,
      required: true,
    },
    orderIndex: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

PollOptionSchema.index({ pollId: 1 });

export const PollOption = mongoose.model<IPollOption>('PollOption', PollOptionSchema);
