import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
}

export interface IPayrollRecord extends Document {
  operatorId: mongoose.Types.ObjectId;
  month: Date;
  amount: number;
  hoursWorked?: number;
  overtimeHours?: number;
  deductions?: number;
  netAmount: number;
  status: PaymentStatus;
  approvedById?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  paidAt?: Date;
  payslipUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollRecordSchema = new Schema<IPayrollRecord>(
  {
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Operator',
      required: true,
    },
    month: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    hoursWorked: Number,
    overtimeHours: Number,
    deductions: Number,
    netAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    approvedById: {
      type: Schema.Types.ObjectId,
      ref: 'Secretary',
    },
    approvedAt: Date,
    paidAt: Date,
    payslipUrl: String,
    notes: String,
  },
  {
    timestamps: true,
  }
);

PayrollRecordSchema.index({ operatorId: 1 });
PayrollRecordSchema.index({ month: 1 });
PayrollRecordSchema.index({ status: 1 });

export const PayrollRecord = mongoose.model<IPayrollRecord>('PayrollRecord', PayrollRecordSchema);
