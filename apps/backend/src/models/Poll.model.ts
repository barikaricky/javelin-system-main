import mongoose, { Schema, Document } from 'mongoose';

export enum PollType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  SCALE = 'SCALE',
  YES_NO = 'YES_NO',
  TEXT = 'TEXT',
}

export enum PollStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export interface IPoll extends Document {
  creatorId: mongoose.Types.ObjectId;
  question: string;
  description?: string;
  type: PollType;
  targetRole?: string;
  isMandatory: boolean;
  status: PollStatus;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PollSchema = new Schema<IPoll>(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Director',
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    description: String,
    type: {
      type: String,
      enum: Object.values(PollType),
      default: PollType.SINGLE_CHOICE,
    },
    targetRole: String,
    isMandatory: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: Object.values(PollStatus),
      default: PollStatus.ACTIVE,
    },
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

PollSchema.index({ creatorId: 1 });
PollSchema.index({ status: 1 });
PollSchema.index({ isMandatory: 1 });

export const Poll = mongoose.model<IPoll>('Poll', PollSchema);
