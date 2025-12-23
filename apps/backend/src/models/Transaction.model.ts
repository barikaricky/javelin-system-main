import mongoose, { Schema, Document } from 'mongoose';

export interface IEditHistory {
  editedAt: Date;
  editedById: mongoose.Types.ObjectId;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  reason?: string;
}

export interface ITransaction extends Document {
  transactionType: 'MONEY_IN' | 'MONEY_OUT';
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'MOBILE_MONEY' | 'POS' | 'OTHER';
  amount: number;
  currency: string;
  description: string;
  category?: string;
  source?: 'CLIENT' | 'INVOICE' | 'STAFF' | 'ASSET_SALE' | 'LOAN' | 'CAPITAL_INJECTION' | 'MISCELLANEOUS';
  clientId?: mongoose.Types.ObjectId;
  invoiceId?: mongoose.Types.ObjectId;
  referenceNumber?: string;
  receiptNumber?: string;
  bankName?: string;
  accountNumber?: string;
  transactionDate: Date;
  recordedById: mongoose.Types.ObjectId;
  isClassified: boolean;
  attachments?: string[];
  notes?: string;
  editHistory?: IEditHistory[];
  deletedAt?: Date;
  deletedById?: mongoose.Types.ObjectId;
  deletionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionType: { type: String, enum: ['MONEY_IN', 'MONEY_OUT'], required: true },
    paymentMethod: { type: String, enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'MOBILE_MONEY', 'POS', 'OTHER'], required: true },
    amount: { type: Number, required: true, min: [0.01, 'Amount must be greater than 0'] },
    currency: { type: String, default: 'NGN' },
    description: { type: String, required: true },
    category: { type: String },
    source: { type: String, enum: ['CLIENT', 'INVOICE', 'STAFF', 'ASSET_SALE', 'LOAN', 'CAPITAL_INJECTION', 'MISCELLANEOUS'] },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    referenceNumber: { type: String },
    receiptNumber: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    transactionDate: { type: Date, required: true },
    recordedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isClassified: { type: Boolean, default: false },
    attachments: [{ type: String }],
    notes: { type: String },
    editHistory: [{
      editedAt: { type: Date, required: true },
      editedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      changes: [{
        field: { type: String, required: true },
        oldValue: { type: Schema.Types.Mixed },
        newValue: { type: Schema.Types.Mixed }
      }],
      reason: { type: String }
    }],
    deletedAt: { type: Date },
    deletedById: { type: Schema.Types.ObjectId, ref: 'User' },
    deletionReason: { type: String }
  },
  { timestamps: true }
);

TransactionSchema.index({ transactionDate: -1 });
TransactionSchema.index({ clientId: 1 });
TransactionSchema.index({ transactionType: 1 });
TransactionSchema.index({ deletedAt: 1 });

// Custom validation for Money In records
TransactionSchema.pre('save', function (next) {
  if (this.transactionType === 'MONEY_IN') {
    // Ensure mandatory fields for Money In
    if (!this.transactionDate) {
      return next(new Error('Transaction date is required for Money In records'));
    }
    if (!this.paymentMethod) {
      return next(new Error('Payment method is required for Money In records'));
    }
    if (!this.attachments || this.attachments.length === 0) {
      return next(new Error('Evidence (receipt/bank alert) is required for Money In records'));
    }
    
    // Validate Cash entries require receipt number
    if (this.paymentMethod === 'CASH' && !this.receiptNumber) {
      return next(new Error('Receipt number is required for Cash payments'));
    }
    
    // Validate Transfer entries should have bank details
    if (['BANK_TRANSFER', 'POS'].includes(this.paymentMethod) && !this.referenceNumber) {
      return next(new Error('Reference number is required for bank transfers'));
    }
  }
  next();
});

// Helper method to track field changes
TransactionSchema.methods.trackChanges = function (
  updates: Partial<ITransaction>,
  userId: string,
  reason?: string
): IEditHistory {
  const changes: { field: string; oldValue: any; newValue: any }[] = [];
  
  const fieldsToTrack = [
    'amount', 'transactionDate', 'paymentMethod', 'description',
    'source', 'clientId', 'invoiceId', 'referenceNumber', 
    'receiptNumber', 'bankName', 'accountNumber', 'notes'
  ];
  
  fieldsToTrack.forEach(field => {
    if (updates[field as keyof ITransaction] !== undefined && 
        this[field] !== updates[field as keyof ITransaction]) {
      changes.push({
        field,
        oldValue: this[field],
        newValue: updates[field as keyof ITransaction]
      });
    }
  });
  
  return {
    editedAt: new Date(),
    editedById: new mongoose.Types.ObjectId(userId),
    changes,
    reason
  };
};

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
