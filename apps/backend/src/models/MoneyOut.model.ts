import mongoose, { Schema, Document } from 'mongoose';

// ========================================
// OPERATIONAL EXPENSE CATEGORIES ONLY
// ========================================
export const MONEY_OUT_CATEGORIES = [
  'LOGISTICS_TRANSPORTATION',
  'EQUIPMENT_PURCHASE',
  'UNIFORM_GEAR',
  'OFFICE_OPERATIONS',
  'UTILITIES',
  'VENDOR_CONTRACTOR_PAYMENT',
  'MAINTENANCE_REPAIRS',
  'EMERGENCY_EXPENSE',
  'REGULATORY_GOVERNMENT_FEES',
  'TRAINING_CERTIFICATION',
  'MISCELLANEOUS'
] as const;

// ========================================
// BLOCKED CATEGORIES (TRIPLE VALIDATION)
// ========================================
export const BLOCKED_CATEGORIES = [
  'SALARY',
  'WAGES',
  'PAYROLL',
  'STAFF_COMPENSATION',
  'EMPLOYEE_PAYMENT'
] as const;

export const BENEFICIARY_TYPES = [
  'VENDOR',
  'CONTRACTOR',
  'SUPPLIER',
  'SERVICE_PROVIDER',
  'GOVERNMENT_AGENCY',
  'UTILITY_COMPANY',
  'OTHER'
] as const;

export const APPROVAL_STATUS = [
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'PAID'
] as const;

export interface IEditHistory {
  editedAt: Date;
  editedById: mongoose.Types.ObjectId;
  reason: string;
  previousAmount?: number;
  newAmount?: number;
  previousCategory?: string;
  newCategory?: string;
  previousPurpose?: string;
  newPurpose?: string;
}

export interface IMoneyOut extends Document {
  category: typeof MONEY_OUT_CATEGORIES[number];
  amount: number;
  purpose: string;
  beneficiaryType: typeof BENEFICIARY_TYPES[number];
  beneficiaryName: string;
  beneficiaryAccount?: string;
  beneficiaryBank?: string;
  paymentDate: Date;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'POS' | 'MOBILE_MONEY';
  
  // Document Management
  supportingDocument: string; // Required on creation
  paymentProof?: string; // Required when marking as paid
  
  // Approval Workflow
  approvalStatus: typeof APPROVAL_STATUS[number];
  requestedById: mongoose.Types.ObjectId;
  approvedById?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectedById?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  rejectionReason?: string;
  paidAt?: Date;
  
  // Edit History
  editHistory: IEditHistory[];
  
  // Soft Delete
  isDeleted: boolean;
  deletedAt?: Date;
  deletedById?: mongoose.Types.ObjectId;
  deletionReason?: string;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

const MoneyOutSchema = new Schema<IMoneyOut>(
  {
    category: {
      type: String,
      enum: MONEY_OUT_CATEGORIES,
      required: [true, 'Category is required'],
      validate: {
        validator: function(value: string) {
          // Validation Layer 1: Check if category contains blocked keywords
          const lowerValue = value.toLowerCase();
          for (const blocked of BLOCKED_CATEGORIES) {
            if (lowerValue.includes(blocked.toLowerCase())) {
              return false;
            }
          }
          return true;
        },
        message: 'Salary-related categories are not allowed in Money Out. Use the Salary Management system.'
      }
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0']
    },
    purpose: {
      type: String,
      required: [true, 'Purpose is required'],
      minlength: [10, 'Purpose must be at least 10 characters'],
      maxlength: [500, 'Purpose cannot exceed 500 characters'],
      validate: {
        validator: function(value: string) {
          // Validation Layer 2: Check if purpose contains salary keywords
          const lowerValue = value.toLowerCase();
          const salaryKeywords = ['salary', 'wage', 'payroll', 'staff payment', 'employee payment', 'compensation'];
          for (const keyword of salaryKeywords) {
            if (lowerValue.includes(keyword)) {
              return false;
            }
          }
          return true;
        },
        message: 'Purpose cannot contain salary-related keywords. This is for operational expenses only.'
      }
    },
    beneficiaryType: {
      type: String,
      enum: BENEFICIARY_TYPES,
      required: [true, 'Beneficiary type is required']
    },
    beneficiaryName: {
      type: String,
      required: [true, 'Beneficiary name is required'],
      trim: true,
      validate: {
        validator: function(value: string) {
          // Validation Layer 3: Check if beneficiary name contains employee/staff keywords
          const lowerValue = value.toLowerCase();
          const employeeKeywords = ['employee', 'staff', 'worker', 'guard payroll', 'operator salary'];
          for (const keyword of employeeKeywords) {
            if (lowerValue.includes(keyword)) {
              return false;
            }
          }
          return true;
        },
        message: 'Beneficiary cannot be employee/staff. This system is for vendors/contractors only.'
      }
    },
    beneficiaryAccount: {
      type: String,
      trim: true
    },
    beneficiaryBank: {
      type: String,
      trim: true
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required']
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'POS', 'MOBILE_MONEY'],
      required: [true, 'Payment method is required']
    },
    supportingDocument: {
      type: String,
      required: [true, 'Supporting document is required (invoice/receipt/quote)']
    },
    paymentProof: {
      type: String
    },
    approvalStatus: {
      type: String,
      enum: APPROVAL_STATUS,
      default: 'PENDING_APPROVAL'
    },
    requestedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    approvedById: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    rejectedById: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectedAt: {
      type: Date
    },
    rejectionReason: {
      type: String
    },
    paidAt: {
      type: Date
    },
    editHistory: [{
      editedAt: {
        type: Date,
        default: Date.now
      },
      editedById: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      reason: {
        type: String,
        required: true
      },
      previousAmount: Number,
      newAmount: Number,
      previousCategory: String,
      newCategory: String,
      previousPurpose: String,
      newPurpose: String
    }],
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date
    },
    deletedById: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    deletionReason: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// ========================================
// PRE-SAVE HOOK: FINAL SALARY BLOCK
// ========================================
MoneyOutSchema.pre('save', function(next) {
  const doc = this as IMoneyOut;
  
  // Convert all text fields to lowercase for checking
  const categoryLower = doc.category?.toLowerCase() || '';
  const purposeLower = doc.purpose?.toLowerCase() || '';
  const beneficiaryLower = doc.beneficiaryName?.toLowerCase() || '';
  
  // Comprehensive salary keyword list
  const salaryKeywords = [
    'salary', 'wage', 'payroll', 'compensation', 'staff', 'employee',
    'worker', 'guard payment', 'operator payment', 'supervisor payment',
    'allowance', 'bonus', 'overtime', 'incentive to staff'
  ];
  
  // Check all fields
  const allText = `${categoryLower} ${purposeLower} ${beneficiaryLower}`;
  
  for (const keyword of salaryKeywords) {
    if (allText.includes(keyword.toLowerCase())) {
      return next(new Error(
        `BLOCKED: Salary/payroll-related expense detected. ` +
        `Money Out is ONLY for operational expenses (vendors, contractors, utilities, etc.). ` +
        `Use the Salary Management system for all staff payments.`
      ));
    }
  }
  
  next();
});

// ========================================
// INDEXES
// ========================================
MoneyOutSchema.index({ approvalStatus: 1, paymentDate: -1 });
MoneyOutSchema.index({ requestedById: 1, createdAt: -1 });
MoneyOutSchema.index({ category: 1, paymentDate: -1 });
MoneyOutSchema.index({ isDeleted: 1 });

const MoneyOut = mongoose.model<IMoneyOut>('MoneyOut', MoneyOutSchema);

export default MoneyOut;
