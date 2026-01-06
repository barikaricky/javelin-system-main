import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  userId: mongoose.Types.ObjectId;
  staffId: string;
  jobTitle: string;
  department: string;
  officeLocationId: mongoose.Types.ObjectId;
  adminRoleLevel: 'BASIC' | 'SENIOR' | 'LEAD';
  employmentStartDate: Date;
  nationalId?: string;
  governmentIdUrl?: string;
  passportPhotoUrl?: string;
  gender?: string;
  dateOfBirth?: Date;
  address?: string;
  stateOfOrigin?: string;
  lga?: string;
  salary?: number;
  salaryCategory?: string;
  bankName?: string;
  bankAccountNumber?: string;
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  suspendedAt?: Date;
  suspendedById?: mongoose.Types.ObjectId;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  loginHistory: {
    timestamp: Date;
    ipAddress: string;
    device: string;
    success: boolean;
  }[];
  accessExpiryDate?: Date;
  createdById: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    staffId: {
      type: String,
      required: true,
      unique: true,
    },
    jobTitle: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
      enum: [
        'Operations',
        'Administration',
        'Records Management',
        'Communication',
        'Coordination',
        'Support Services',
        'Other',
      ],
    },
    officeLocationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    adminRoleLevel: {
      type: String,
      enum: ['BASIC', 'SENIOR', 'LEAD'],
      default: 'BASIC',
    },
    employmentStartDate: {
      type: Date,
      required: true,
    },
    nationalId: {
      type: String,
    },
    governmentIdUrl: {
      type: String,
    },
    passportPhotoUrl: {
      type: String,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
    },
    dateOfBirth: {
      type: Date,
    },
    address: {
      type: String,
    },
    stateOfOrigin: {
      type: String,
    },
    lga: {
      type: String,
    },
    salary: {
      type: Number,
      min: 0,
    },
    salaryCategory: {
      type: String,
    },
    bankName: {
      type: String,
    },
    bankAccountNumber: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspensionReason: {
      type: String,
    },
    suspendedAt: {
      type: Date,
    },
    suspendedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    lastLoginAt: {
      type: Date,
    },
    lastLoginIp: {
      type: String,
    },
    loginHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        ipAddress: String,
        device: String,
        success: { type: Boolean, default: true },
      },
    ],
    accessExpiryDate: {
      type: Date,
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries (userId and staffId already have unique indexes from schema)
AdminSchema.index({ officeLocationId: 1 });
AdminSchema.index({ isActive: 1 });
AdminSchema.index({ isSuspended: 1 });
AdminSchema.index({ createdById: 1 });

// Generate unique staff ID before saving
AdminSchema.pre('save', async function (next) {
  if (this.isNew && !this.staffId) {
    const count = await mongoose.model('Admin').countDocuments();
    this.staffId = `ADM-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);
