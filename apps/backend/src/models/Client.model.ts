import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  clientName: string;
  companyName?: string;
  email: string;
  phone: string;
  address: string;
  state: string;
  lga: string;
  securityType: string[]; // e.g., ['GUARD_DEPLOYMENT', 'EVENT_SECURITY', 'ESCORT', 'PRIVATE_PREMISES']
  serviceType: string; // e.g., 'CORPORATE', 'RESIDENTIAL', 'EVENT', 'ESCORT'
  numberOfGuards: number;
  monthlyPayment: number;
  paymentMethod: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'PER_EVENT';
  contractStartDate: Date;
  contractEndDate?: Date;
  isActive: boolean;
  contactPerson?: string;
  contactPersonPhone?: string;
  alternativePhone?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  assignedGuards?: Array<{
    operatorId: mongoose.Types.ObjectId;
    supervisorId?: mongoose.Types.ObjectId;
    assignedDate: Date;
    postType: string; // e.g., 'DAY_SHIFT', 'NIGHT_SHIFT', 'ROTATION'
  }>;
  notes?: string;
  documents?: string[];
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    clientName: { type: String, required: true },
    companyName: { type: String },
    email: { type: String, unique: true, sparse: true }, // sparse allows multiple null values
    phone: { type: String, required: true },
    address: { type: String, required: true },
    state: { type: String, required: true },
    lga: { type: String, required: true },
    securityType: [{ type: String }],
    serviceType: { type: String, required: true },
    numberOfGuards: { type: Number, required: true, default: 0 },
    monthlyPayment: { type: Number, required: true, default: 0 },
    paymentMethod: { type: String, enum: ['MONTHLY', 'QUARTERLY', 'ANNUALLY', 'PER_EVENT'], required: true },
    contractStartDate: { type: Date, required: true },
    contractEndDate: { type: Date },
    isActive: { type: Boolean, default: true },
    contactPerson: { type: String },
    contactPersonPhone: { type: String },
    alternativePhone: { type: String },
    bankDetails: {
      bankName: { type: String },
      accountNumber: { type: String },
      accountName: { type: String },
    },
    assignedGuards: [{
      operatorId: { type: Schema.Types.ObjectId, ref: 'Operator' },
      supervisorId: { type: Schema.Types.ObjectId, ref: 'Supervisor' },
      assignedDate: { type: Date, default: Date.now },
      postType: { type: String }
    }],
    notes: { type: String },
    documents: [{ type: String }],
    createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ClientSchema.index({ isActive: 1 });

export const Client = mongoose.model<IClient>('Client', ClientSchema);
