import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget extends Document {
  budgetName: string;
  budgetPeriod: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  categories: {
    categoryName: string;
    allocatedAmount: number;
    spentAmount: number;
  }[];
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdById: mongoose.Types.ObjectId;
  approvedById?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    budgetName: { type: String, required: true },
    budgetPeriod: { type: String, enum: ['MONTHLY', 'QUARTERLY', 'ANNUALLY'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true },
    categories: [
      {
        categoryName: { type: String, required: true },
        allocatedAmount: { type: Number, required: true },
        spentAmount: { type: Number, default: 0 },
      },
    ],
    status: { type: String, enum: ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'], default: 'DRAFT' },
    createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedById: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);
