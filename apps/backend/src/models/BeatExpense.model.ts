import mongoose, { Schema, Document } from 'mongoose';

export interface IBeatExpense extends Document {
  beatId: mongoose.Types.ObjectId;
  beatName: string;
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

const BeatExpenseSchema = new Schema<IBeatExpense>(
  {
    beatId: {
      type: Schema.Types.ObjectId,
      ref: 'Beat',
      required: function() {
        return !this.isUnallocated;
      },
    },
    beatName: {
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
BeatExpenseSchema.index({ beatId: 1, dateIncurred: -1 });
BeatExpenseSchema.index({ isDeleted: 1, dateIncurred: -1 });
BeatExpenseSchema.index({ category: 1 });
BeatExpenseSchema.index({ isUnallocated: 1 });
BeatExpenseSchema.index({ addedBy: 1 });

const BeatExpense = mongoose.model<IBeatExpense>('BeatExpense', BeatExpenseSchema);

export default BeatExpense;
