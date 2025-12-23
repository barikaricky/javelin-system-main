import mongoose, { Schema, Document } from 'mongoose';

export interface ISecretary extends Document {
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  fullName: string;
  salary: number;
  salaryCategory?: string;
  bankName?: string;
  bankAccountNumber?: string;
  address: string;
  dateOfEmployment: Date;
  startDate: Date;
  passportPhoto?: string;
  nationalId?: string;
  regionAssigned?: string;
  idCard?: string;
  termsAccepted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SecretarySchema = new Schema<ISecretary>(
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
    fullName: {
      type: String,
      required: true,
    },
    salary: {
      type: Number,
      required: true,
    },
    salaryCategory: String,
    bankName: String,
    bankAccountNumber: String,
    address: {
      type: String,
      required: true,
    },
    dateOfEmployment: {
      type: Date,
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    passportPhoto: String,
    nationalId: String,
    regionAssigned: String,
    idCard: String,
    termsAccepted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Secretary = mongoose.model<ISecretary>('Secretary', SecretarySchema);
