import mongoose, { Schema, Document } from 'mongoose';

export enum WorkerRole {
  OPERATOR = 'OPERATOR',
  SUPERVISOR = 'SUPERVISOR',
  GENERAL_SUPERVISOR = 'GENERAL_SUPERVISOR',
  MANAGER = 'MANAGER',
  SECRETARY = 'SECRETARY'
}

export enum DeductionType {
  OFFENCE = 'OFFENCE',
  DAMAGE = 'DAMAGE',
  ABSENCE = 'ABSENCE',
  LATE_REPORTING = 'LATE_REPORTING',
  OTHER = 'OTHER'
}

export enum SalaryStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  REJECTED = 'REJECTED'
}

interface IAllowance {
  name: string;
  amount: number;
  description?: string;
}

interface IDeduction {
  type: DeductionType;
  amount: number;
  reason: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  isSystemGenerated: boolean; // true if auto-deducted by system, false if MD-approved
}

export interface ISalary extends Document {
  worker: mongoose.Types.ObjectId;
  workerName: string;
  workerRole: WorkerRole;
  month: number; // 1-12
  year: number;
  baseSalary: number;
  allowances: IAllowance[];
  deductions: IDeduction[];
  totalAllowances: number; // Auto-calculated
  totalDeductions: number; // Auto-calculated
  netSalary: number; // Auto-calculated: baseSalary + totalAllowances - totalDeductions
  status: SalaryStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  paidBy?: mongoose.Types.ObjectId;
  paidAt?: Date;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date;
  deleteReason?: string;
}

const AllowanceSchema = new Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String }
}, { _id: false });

const DeductionSchema = new Schema({
  type: { 
    type: String, 
    enum: Object.values(DeductionType), 
    required: true 
  },
  amount: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  isSystemGenerated: { type: Boolean, default: false }
}, { _id: false });

const SalarySchema = new Schema<ISalary>({
  worker: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  workerName: { type: String, required: true },
  workerRole: { 
    type: String, 
    enum: Object.values(WorkerRole), 
    required: true,
    index: true
  },
  month: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 12,
    index: true
  },
  year: { 
    type: Number, 
    required: true,
    index: true
  },
  baseSalary: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  allowances: [AllowanceSchema],
  deductions: [DeductionSchema],
  totalAllowances: { 
    type: Number, 
    default: 0 
  },
  totalDeductions: { 
    type: Number, 
    default: 0 
  },
  netSalary: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: Object.values(SalaryStatus), 
    default: SalaryStatus.PENDING,
    index: true
  },
  approvedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  approvedAt: { type: Date },
  paidBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  paidAt: { type: Date },
  paymentMethod: { type: String },
  paymentReference: { type: String },
  notes: { type: String },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  isDeleted: { 
    type: Boolean, 
    default: false,
    index: true
  },
  deletedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  deletedAt: { type: Date },
  deleteReason: { type: String }
}, {
  timestamps: true
});

// Compound index for uniqueness: one salary record per worker per month/year
SalarySchema.index({ worker: 1, month: 1, year: 1 }, { unique: true });

// Pre-save hook to auto-calculate totals and net salary
SalarySchema.pre('save', function(next) {
  // Calculate total allowances
  this.totalAllowances = this.allowances.reduce((sum, allowance) => sum + allowance.amount, 0);
  
  // Calculate total deductions
  this.totalDeductions = this.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
  
  // Calculate net salary
  this.netSalary = this.baseSalary + this.totalAllowances - this.totalDeductions;
  
  next();
});

// Instance method to add deduction (MD-approved only)
SalarySchema.methods.addDeduction = function(
  type: DeductionType, 
  amount: number, 
  reason: string, 
  approvedBy: mongoose.Types.ObjectId,
  isSystemGenerated: boolean = false
) {
  this.deductions.push({
    type,
    amount,
    reason,
    approvedBy,
    approvedAt: new Date(),
    isSystemGenerated
  });
  return this.save();
};

// Instance method to mark as paid
SalarySchema.methods.markAsPaid = function(
  paidBy: mongoose.Types.ObjectId,
  paymentMethod: string,
  paymentReference?: string
) {
  this.status = SalaryStatus.PAID;
  this.paidBy = paidBy;
  this.paidAt = new Date();
  this.paymentMethod = paymentMethod;
  this.paymentReference = paymentReference;
  return this.save();
};

// Static method to get monthly forecast
SalarySchema.statics.getMonthlyForecast = async function(month: number, year: number) {
  return this.aggregate([
    {
      $match: {
        month,
        year,
        isDeleted: false
      }
    },
    {
      $group: {
        _id: '$workerRole',
        count: { $sum: 1 },
        totalBaseSalary: { $sum: '$baseSalary' },
        totalAllowances: { $sum: '$totalAllowances' },
        totalDeductions: { $sum: '$totalDeductions' },
        totalNetSalary: { $sum: '$netSalary' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Static method to get salary statistics
SalarySchema.statics.getStats = async function(month?: number, year?: number) {
  const matchQuery: any = { isDeleted: false };
  if (month) matchQuery.month = month;
  if (year) matchQuery.year = year;

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalWorkers: { $sum: 1 },
        totalBaseSalary: { $sum: '$baseSalary' },
        totalAllowances: { $sum: '$totalAllowances' },
        totalDeductions: { $sum: '$totalDeductions' },
        totalNetSalary: { $sum: '$netSalary' },
        paidCount: {
          $sum: { $cond: [{ $eq: ['$status', SalaryStatus.PAID] }, 1, 0] }
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', SalaryStatus.PENDING] }, 1, 0] }
        },
        approvedCount: {
          $sum: { $cond: [{ $eq: ['$status', SalaryStatus.APPROVED] }, 1, 0] }
        }
      }
    }
  ]);
};

export const Salary = mongoose.model<ISalary>('Salary', SalarySchema);
