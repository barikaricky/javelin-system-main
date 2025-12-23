import mongoose, { Schema, Document } from 'mongoose';

export enum RegistrationRole {
  SUPERVISOR = 'SUPERVISOR',
  HR = 'HR',
  SECRETARY = 'SECRETARY',
  GENERAL_SUPERVISOR = 'GENERAL_SUPERVISOR',
  GUARD = 'GUARD',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface IRegistrationRequest extends Document {
  requestedById: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  role: RegistrationRole;
  locationId?: mongoose.Types.ObjectId;
  department?: string;
  startDate?: Date;
  profilePhoto?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  employmentType?: string;
  shift?: string;
  documents?: any;
  managerComments?: string;
  status: RequestStatus;
  reviewedById?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  generatedUserId?: string;
  generatedEmployeeId?: string;
  generatedPassword?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationRequestSchema = new Schema<IRegistrationRequest>(
  {
    requestedById: {
      type: Schema.Types.ObjectId,
      ref: 'Manager',
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(RegistrationRole),
      required: true,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
    },
    department: String,
    startDate: Date,
    profilePhoto: String,
    dateOfBirth: Date,
    gender: String,
    address: String,
    employmentType: {
      type: String,
      default: 'FULL_TIME',
    },
    shift: String,
    documents: Schema.Types.Mixed,
    managerComments: String,
    status: {
      type: String,
      enum: Object.values(RequestStatus),
      default: RequestStatus.PENDING,
    },
    reviewedById: String,
    reviewedAt: Date,
    rejectionReason: String,
    generatedUserId: String,
    generatedEmployeeId: String,
    generatedPassword: String,
  },
  {
    timestamps: true,
  }
);

RegistrationRequestSchema.index({ requestedById: 1 });
RegistrationRequestSchema.index({ status: 1 });
RegistrationRequestSchema.index({ role: 1 });
RegistrationRequestSchema.index({ createdAt: 1 });

export const RegistrationRequest = mongoose.model<IRegistrationRequest>(
  'RegistrationRequest',
  RegistrationRequestSchema
);
