import mongoose, { Schema, Document } from 'mongoose';

export enum SupervisorType {
  GENERAL_SUPERVISOR = 'GENERAL_SUPERVISOR',
  SUPERVISOR = 'SUPERVISOR',
  FIELD_SUPERVISOR = 'FIELD_SUPERVISOR',
  SHIFT_SUPERVISOR = 'SHIFT_SUPERVISOR',
  AREA_SUPERVISOR = 'AREA_SUPERVISOR',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface ISupervisor extends Document {
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  locationId?: mongoose.Types.ObjectId;
  salary: number;
  startDate: Date;
  address: string;
  dateOfEmployment: Date;
  fullName: string;
  idCard?: string;
  passportPhoto?: string;
  rank?: string;
  termsAccepted: boolean;
  approvalStatus: ApprovalStatus;
  approvedById?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  generatedPassword?: string;
  rawPassword?: string;
  supervisorType: SupervisorType;
  salaryCategory?: string;
  allowance?: number;
  bankName?: string;
  bankAccountNumber?: string;
  regionAssigned?: string;
  escalationRights?: string;
  expectedVisitFrequency?: string;
  reportSubmissionType?: string;
  generalSupervisorId?: mongoose.Types.ObjectId;
  bitsAssigned: string[];
  locationsAssigned: string[];
  visitSchedule?: string;
  shiftType?: string;
  isMotorbikeOwner: boolean;
  transportAllowanceEligible: boolean;
  nationalId?: string;
  mustResetPassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupervisorSchema = new Schema<ISupervisor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true, // Allow null/undefined values
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
    },
    salary: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    address: {
      type: String,
    },
    dateOfEmployment: {
      type: Date,
    },
    fullName: {
      type: String,
      required: true,
    },
    idCard: String,
    passportPhoto: String,
    rank: String,
    termsAccepted: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: Object.values(ApprovalStatus),
      default: ApprovalStatus.PENDING,
    },
    approvedById: String,
    approvedAt: Date,
    rejectionReason: String,
    generatedPassword: String,
    rawPassword: String,
    supervisorType: {
      type: String,
      enum: Object.values(SupervisorType),
      default: SupervisorType.SUPERVISOR,
    },
    salaryCategory: String,
    allowance: Number,
    bankName: String,
    bankAccountNumber: String,
    regionAssigned: String,
    escalationRights: String,
    expectedVisitFrequency: String,
    reportSubmissionType: String,
    generalSupervisorId: {
      type: Schema.Types.ObjectId,
      ref: 'Supervisor',
    },
    bitsAssigned: {
      type: [String],
      default: [],
    },
    locationsAssigned: {
      type: [String],
      default: [],
    },
    visitSchedule: String,
    shiftType: String,
    isMotorbikeOwner: {
      type: Boolean,
      default: false,
    },
    transportAllowanceEligible: {
      type: Boolean,
      default: false,
    },
    nationalId: String,
    mustResetPassword: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

SupervisorSchema.index({ locationId: 1 });
SupervisorSchema.index({ supervisorType: 1 });
SupervisorSchema.index({ generalSupervisorId: 1 });

export const Supervisor = mongoose.model<ISupervisor>('Supervisor', SupervisorSchema);
