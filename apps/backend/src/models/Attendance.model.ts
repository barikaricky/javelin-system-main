import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  operatorId: mongoose.Types.ObjectId;
  shiftId: mongoose.Types.ObjectId;
  checkInTime: Date;
  checkOutTime?: Date;
  checkInGpsLat?: number;
  checkInGpsLng?: number;
  checkOutGpsLat?: number;
  checkOutGpsLng?: number;
  verifiedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Operator',
      required: true,
    },
    shiftId: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      required: true,
    },
    checkInTime: {
      type: Date,
      required: true,
    },
    checkOutTime: Date,
    checkInGpsLat: Number,
    checkInGpsLng: Number,
    checkOutGpsLat: Number,
    checkOutGpsLng: Number,
    verifiedBy: String,
    notes: String,
  },
  {
    timestamps: true,
  }
);

AttendanceSchema.index({ operatorId: 1 });
AttendanceSchema.index({ shiftId: 1 });
AttendanceSchema.index({ checkInTime: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
