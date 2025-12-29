import mongoose, { Schema, Document } from 'mongoose';

export interface IBitExpense extends Document {
  bitId: mongoose.Types.ObjectId;
  bitName: string;
  clientName?: string;
  locationName?: string;
  category: 'EQUIPMENT' | 'UNIFORMS' | 'TRANSPORTATION' | 'FUEL' | 'MAINTENANCE' | 'REPAIRS' | 'LOGISTICS' | 'EMERGENCY' | 'UTILITIES' | 'CONSUMABLES' | 'OTHER';
  description: string;
  amount: number;
  dateIncurred: Date;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER';
  isUnallocated: boolean;
  addedBy: mongoose.Types.ObjectId;
  addedByName: string;
  addedByRole: string;
  lastEditedBy?: mongoose.Types.ObjectId;
  lastEditedByName?: string;
  lastEditedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  deletedByName?: string;
  deletedAt?: Date;
  isDeleted: boolean;
  receiptUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BitExpenseSchema = new Schema<IBitExpense>(
  {
    bitId: {
      type: Schema.Types.ObjectId,
      ref: 'Bit',
      required: function() {
        return !this.isUnallocated;
      },
    },
    bitName: {
      type: String,
      required: true,
    },
    clientName: String,
    locationName: String,
    category: {
      type: String,
      enum: ['EQUIPMENT', 'UNIFORMS', 'TRANSPORTATION', 'FUEL', 'MAINTENANCE', 'REPAIRS', 'LOGISTICS', 'EMERGENCY', 'UTILITIES', 'CONSUMABLES', 'OTHER'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dateIncurred: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'TRANSFER', 'CARD', 'OTHER'],
      required: true,
      default: 'CASH',
    },
    isUnallocated: {
      type: Boolean,
      default: false,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    addedByName: {
      type: String,
      required: true,
    },
    addedByRole: {
      type: String,
      required: true,
    },
    lastEditedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    lastEditedByName: String,
    lastEditedAt: Date,
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedByName: String,
    deletedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    receiptUrl: String,
    notes: String,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for performance
BitExpenseSchema.index({ bitId: 1, dateIncurred: -1 });
BitExpenseSchema.index({ isDeleted: 1, dateIncurred: -1 });
BitExpenseSchema.index({ category: 1 });
BitExpenseSchema.index({ isUnallocated: 1 });
BitExpenseSchema.index({ addedBy: 1 });

const BitExpense = mongoose.model<IBitExpense>('BitExpense', BitExpenseSchema);

export default BitExpense;
