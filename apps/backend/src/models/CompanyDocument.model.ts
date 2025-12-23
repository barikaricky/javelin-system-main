import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanyDocument extends Document {
  documentName: string;
  documentType: 'LICENSE' | 'PERMIT' | 'CERTIFICATE' | 'INSURANCE' | 'CONTRACT' | 'OTHER';
  documentNumber?: string;
  issuer?: string;
  registrationDate: Date;
  expiryDate: Date;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  description?: string;
  isActive: boolean;
  isExpiringSoon: boolean;
  notificationSent: boolean;
  uploadedById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CompanyDocumentSchema = new Schema<ICompanyDocument>(
  {
    documentName: {
      type: String,
      required: true,
      trim: true,
    },
    documentType: {
      type: String,
      enum: ['LICENSE', 'PERMIT', 'CERTIFICATE', 'INSURANCE', 'CONTRACT', 'OTHER'],
      required: true,
      index: true,
    },
    documentNumber: {
      type: String,
      trim: true,
      sparse: true,
    },
    issuer: {
      type: String,
      trim: true,
    },
    registrationDate: {
      type: Date,
      required: true,
      index: true,
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isExpiringSoon: {
      type: Boolean,
      default: false,
      index: true,
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    uploadedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
CompanyDocumentSchema.index({ documentName: 'text', documentNumber: 'text', issuer: 'text', description: 'text' });

// Virtual to check days until expiry
CompanyDocumentSchema.virtual('daysUntilExpiry').get(function() {
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to check if document is expired
CompanyDocumentSchema.methods.isExpired = function(): boolean {
  return new Date() > new Date(this.expiryDate);
};

// Pre-save hook to update isExpiringSoon status
CompanyDocumentSchema.pre('save', function(next) {
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Mark as expiring soon if less than 30 days
  this.isExpiringSoon = diffDays > 0 && diffDays <= 30;
  
  // Mark as inactive if expired
  if (diffDays < 0) {
    this.isActive = false;
  }
  
  next();
});

export const CompanyDocument = mongoose.model<ICompanyDocument>('CompanyDocument', CompanyDocumentSchema);
