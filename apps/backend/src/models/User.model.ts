import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  DEVELOPER = 'DEVELOPER',
  DIRECTOR = 'DIRECTOR',
  GENERAL_SUPERVISOR = 'GENERAL_SUPERVISOR',
  SUPERVISOR = 'SUPERVISOR',
  OPERATOR = 'OPERATOR',
  SECRETARY = 'SECRETARY',
  MANAGER = 'MANAGER',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
}

export interface IUser extends Document {
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  lastLogin?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  createdById?: mongoose.Types.ObjectId;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  monthlySalary?: number;
  bloodGroup?: string;
  dateOfBirth?: Date;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  employeeId?: string;
  gender?: string;
  lga?: string;
  nationality?: string;
  nextOfKin?: string;
  nextOfKinPhone?: string;
  passportPhoto?: string;
  state?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.PENDING,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    profilePhoto: String,
    lastLogin: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: String,
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    accountName: String,
    accountNumber: String,
    bankName: String,
    monthlySalary: {
      type: Number,
      min: 0,
      default: 0,
    },
    bloodGroup: String,
    dateOfBirth: Date,
    emergencyContactName: String,
    emergencyContactPhone: String,
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
    },
    gender: String,
    lga: String,
    nationality: {
      type: String,
      default: 'Nigerian',
    },
    nextOfKin: String,
    nextOfKinPhone: String,
    passportPhoto: String,
    state: String,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

// Indexes
// Note: email and employeeId already have unique: true, which creates an index
UserSchema.index({ role: 1, status: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
