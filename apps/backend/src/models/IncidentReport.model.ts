import mongoose, { Schema, Document } from 'mongoose';

export enum IncidentStatus {
  REPORTED = 'REPORTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export interface IIncidentReport extends Document {
  operatorId: mongoose.Types.ObjectId;
  supervisorId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  photoUrl?: string;
  severity: string;
  status: IncidentStatus;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentReportSchema = new Schema<IIncidentReport>(
  {
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Operator',
      required: true,
    },
    supervisorId: {
      type: Schema.Types.ObjectId,
      ref: 'Supervisor',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    photoUrl: String,
    severity: {
      type: String,
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: Object.values(IncidentStatus),
      default: IncidentStatus.REPORTED,
    },
    resolvedBy: String,
    resolvedAt: Date,
  },
  {
    timestamps: true,
  }
);

IncidentReportSchema.index({ operatorId: 1 });
IncidentReportSchema.index({ supervisorId: 1 });
IncidentReportSchema.index({ status: 1 });

export const IncidentReport = mongoose.model<IIncidentReport>('IncidentReport', IncidentReportSchema);
