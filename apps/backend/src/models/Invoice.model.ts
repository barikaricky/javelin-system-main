import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  invoiceNumber: string;
  clientId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  description: string;
  serviceType: string;
  invoiceDate: Date;
  dueDate: Date;
  status: 'PENDING' | 'SENT' | 'OVERDUE' | 'PAID' | 'CANCELLED';
  sentDate?: Date;
  paidDate?: Date;
  paidAmount?: number;
  paymentMethod?: string;
  paymentReference?: string;
  remindersSent: number;
  lastReminderDate?: Date;
  notes?: string;
  attachments?: string[];
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    description: { type: String, required: true },
    serviceType: { type: String, required: true },
    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['PENDING', 'SENT', 'OVERDUE', 'PAID', 'CANCELLED'], default: 'PENDING' },
    sentDate: { type: Date },
    paidDate: { type: Date },
    paidAmount: { type: Number },
    paymentMethod: { type: String },
    paymentReference: { type: String },
    remindersSent: { type: Number, default: 0 },
    lastReminderDate: { type: Date },
    notes: { type: String },
    attachments: [{ type: String }],
    createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

InvoiceSchema.index({ clientId: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ dueDate: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
