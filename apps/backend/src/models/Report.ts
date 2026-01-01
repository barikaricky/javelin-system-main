import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  title: string;
  reportType: 'DAILY_ACTIVITY' | 'INCIDENT' | 'EMERGENCY' | 'VISITOR_LOG' | 'PATROL' | 'EQUIPMENT' | 'CLIENT_INSTRUCTION' | 'END_OF_SHIFT';
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REVISION_REQUIRED' | 'REJECTED';
  
  // Required Links
  supervisorId: mongoose.Types.ObjectId;
  bitId: mongoose.Types.ObjectId;
  locationId: mongoose.Types.ObjectId;
  
  // Date & Time
  occurrenceDate: Date;
  occurrenceTime: string;
  
  // Content
  description: string;
  chronologicalNarrative?: string;
  
  // Evidence
  images: Array<{
    url: string;
    filename: string;
    uploadedAt: Date;
    description?: string;
  }>;
  
  audioRecordings: Array<{
    url: string;
    filename: string;
    duration?: number;
    transcription?: string;
    uploadedAt: Date;
  }>;
  
  attachedFiles: Array<{
    url: string;
    filename: string;
    fileType: string;
    fileSize: number;
    uploadedAt: Date;
  }>;
  
  // Approval Workflow
  submittedAt?: Date;
  submittedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  revisionNotes?: string;
  
  // Audit Trail
  auditLog: Array<{
    action: 'CREATED' | 'EDITED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED' | 'VIEWED' | 'EXPORTED';
    performedBy: mongoose.Types.ObjectId;
    performedAt: Date;
    details?: string;
    ipAddress?: string;
  }>;
  
  // Metadata
  isLocked: boolean;
  lockedAt?: Date;
  tags?: string[];
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const ReportSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    
    reportType: {
      type: String,
      required: [true, 'Report type is required'],
      enum: ['DAILY_ACTIVITY', 'INCIDENT', 'EMERGENCY', 'VISITOR_LOG', 'PATROL', 'EQUIPMENT', 'CLIENT_INSTRUCTION', 'END_OF_SHIFT'],
    },
    
    status: {
      type: String,
      required: true,
      enum: ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REVISION_REQUIRED', 'REJECTED'],
      default: 'DRAFT',
    },
    
    // Required Links
    supervisorId: {
      type: Schema.Types.ObjectId,
      ref: 'Supervisor',
      required: [true, 'Supervisor is required'],
    },
    
    bitId: {
      type: Schema.Types.ObjectId,
      ref: 'Bit',
      required: [true, 'BIT is required'],
    },
    
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location is required'],
    },
    
    // Date & Time
    occurrenceDate: {
      type: Date,
      required: [true, 'Occurrence date is required'],
    },
    
    occurrenceTime: {
      type: String,
      required: [true, 'Occurrence time is required'],
    },
    
    // Content
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
    },
    
    chronologicalNarrative: {
      type: String,
    },
    
    // Evidence
    images: [{
      url: String,
      filename: String,
      uploadedAt: { type: Date, default: Date.now },
      description: String,
    }],
    
    audioRecordings: [{
      url: String,
      filename: String,
      duration: Number,
      transcription: String,
      uploadedAt: { type: Date, default: Date.now },
    }],
    
    attachedFiles: [{
      url: String,
      filename: String,
      fileType: String,
      fileSize: Number,
      uploadedAt: { type: Date, default: Date.now },
    }],
    
    // Approval Workflow
    submittedAt: Date,
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: String,
    revisionNotes: String,
    
    // Audit Trail
    auditLog: [{
      action: {
        type: String,
        enum: ['CREATED', 'EDITED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED', 'VIEWED', 'EXPORTED'],
      },
      performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      performedAt: { type: Date, default: Date.now },
      details: String,
      ipAddress: String,
    }],
    
    // Metadata
    isLocked: {
      type: Boolean,
      default: false,
    },
    
    lockedAt: Date,
    
    tags: [String],
    
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ReportSchema.index({ reportType: 1, status: 1 });
ReportSchema.index({ bitId: 1, occurrenceDate: -1 });
ReportSchema.index({ locationId: 1, occurrenceDate: -1 });
ReportSchema.index({ supervisorId: 1, createdAt: -1 });
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ occurrenceDate: -1 });

// Middleware: Lock report on approval
ReportSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'APPROVED' && !this.isLocked) {
    this.isLocked = true;
    this.lockedAt = new Date();
    this.approvedAt = new Date();
  }
  next();
});

// Method to add audit log entry
ReportSchema.methods.addAuditLog = function(action: string, userId: mongoose.Types.ObjectId, details?: string, ipAddress?: string) {
  this.auditLog.push({
    action,
    performedBy: userId,
    performedAt: new Date(),
    details,
    ipAddress,
  });
  return this.save();
};

// Method to check if report can be edited
ReportSchema.methods.canEdit = function(userRole: string) {
  // Directors can always edit
  if (userRole === 'DIRECTOR') return true;
  
  // Once approved, only directors can edit
  if (this.status === 'APPROVED') return false;
  
  // Drafts and revisions can be edited by supervisor/GS
  if (this.status === 'DRAFT' || this.status === 'REVISION_REQUIRED') {
    return ['SUPERVISOR', 'GENERAL_SUPERVISOR'].includes(userRole);
  }
  
  return false;
};

export default mongoose.model<IReport>('Report', ReportSchema);
