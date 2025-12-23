import mongoose, { Schema, Document } from 'mongoose';

export interface IDirector extends Document {
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  startDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DirectorSchema = new Schema<IDirector>(
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
    startDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Director = mongoose.model<IDirector>('Director', DirectorSchema);
