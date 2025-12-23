import mongoose, { Schema, Document } from 'mongoose';

export interface IManager extends Document {
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  locationId?: mongoose.Types.ObjectId;
  department?: string;
  startDate: Date;
  createdById?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ManagerSchema = new Schema<IManager>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
    },
    department: String,
    startDate: {
      type: Date,
      default: Date.now,
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

ManagerSchema.index({ locationId: 1 });

export const Manager = mongoose.model<IManager>('Manager', ManagerSchema);
