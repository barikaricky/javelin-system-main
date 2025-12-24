import mongoose, { Schema, Document } from 'mongoose';

export enum EmergencyAlertStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SENT = 'SENT',
}

export enum EmergencyAlertType {
  THREAT = 'THREAT',
  INJURY = 'INJURY',
  BREACH = 'BREACH',
  FIRE = 'FIRE',
  CLIENT_ISSUE = 'CLIENT_ISSUE',
  OTHER = 'OTHER',
}

export interface IEmergencyAlert extends Document {
  title: string;
  content: string;
  alertType: EmergencyAlertType;
  status: EmergencyAlertStatus;
  
  // Context
  bitId?: mongoose.Types.ObjectId;
  locationId?: mongoose.Types.ObjectId;
  
  // Workflow
  triggeredById: mongoose.Types.ObjectId;
  approvedById?: mongoose.Types.ObjectId;
  rejectedById?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  
  // Targeting
  targetRoles: string[];
  targetUserIds: string[];
  
  // Acknowledgment tracking
  acknowledgments: Array<{
    userId: mongoose.Types.ObjectId;
    acknowledgedAt: Date;
  }>;
  
  // Metadata
  sentAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyAlertSchema = new Schema<IEmergencyAlert>(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    alertType: {
      type: String,
      enum: Object.values(EmergencyAlertType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EmergencyAlertStatus),
      default: EmergencyAlertStatus.PENDING,
    },
    bitId: {
      type: Schema.Types.ObjectId,
      ref: 'Bit',
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
    },
    triggeredById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: String,
    targetRoles: {
      type: [String],
      default: [],
    },
    targetUserIds: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    acknowledgments: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        acknowledgedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    sentAt: Date,
    expiresAt: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
EmergencyAlertSchema.index({ status: 1, createdAt: -1 });
EmergencyAlertSchema.index({ triggeredById: 1 });
EmergencyAlertSchema.index({ approvedById: 1 });
EmergencyAlertSchema.index({ bitId: 1 });
EmergencyAlertSchema.index({ locationId: 1 });
EmergencyAlertSchema.index({ isActive: 1, sentAt: -1 });

export const EmergencyAlert = mongoose.model<IEmergencyAlert>(
  'EmergencyAlert',
  EmergencyAlertSchema
);
