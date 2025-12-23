import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  submittedById: mongoose.Types.ObjectId;
  locationId?: mongoose.Types.ObjectId;
  category: string;
  description: string;
  amount: number;
  expenseDate: Date;
  receipts?: any;
  status: string;
  approvedById?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  paidAt?: Date;
  notes?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    submittedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    expenseDate: {
      type: Date,
      required: true,
    },
    receipts: Schema.Types.Mixed,
    status: {
      type: String,
      default: 'PENDING',
    },
    approvedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    paidAt: Date,
    notes: String,
    paymentMethod: String,
    referenceNumber: String,
  },
  {
    timestamps: true,
  }
);

ExpenseSchema.index({ submittedById: 1 });
ExpenseSchema.index({ approvedById: 1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ status: 1 });
ExpenseSchema.index({ expenseDate: 1 });
ExpenseSchema.index({ locationId: 1 });

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);
