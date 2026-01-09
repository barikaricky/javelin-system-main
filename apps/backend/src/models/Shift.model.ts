import mongoose, { Schema, Document } from 'mongoose';

export interface IShift extends Document {
  operatorId: mongoose.Types.ObjectId;
  locationId: mongoose.Types.ObjectId;
  beatId?: mongoose.Types.ObjectId;
  assignmentId?: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftSchema = new Schema<IShift>(
  {
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Operator',
      required: true,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    beatId: {
      type: Schema.Types.ObjectId,
      ref: 'Beat',
    },
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'GuardAssignment',
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      default: 'SCHEDULED',
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

ShiftSchema.index({ operatorId: 1 });
ShiftSchema.index({ locationId: 1 });
ShiftSchema.index({ beatId: 1 });
ShiftSchema.index({ assignmentId: 1 });
ShiftSchema.index({ startTime: 1 });

export const Shift = mongoose.model<IShift>('Shift', ShiftSchema);
