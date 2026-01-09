import mongoose, { Document, Schema } from 'mongoose';

export interface IGuardAssignment extends Document {
  // Core Assignment
  operatorId: mongoose.Types.ObjectId;
  beatId: mongoose.Types.ObjectId;
  locationId: mongoose.Types.ObjectId;
  supervisorId: mongoose.Types.ObjectId;
  
  // Assignment Details
  assignmentType: 'PERMANENT' | 'TEMPORARY' | 'RELIEF';
  shiftType: 'DAY' | 'NIGHT' | '24_HOURS' | 'ROTATING';
  startDate: Date;
  endDate?: Date;
  
  // Approval Workflow
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'ENDED' | 'TRANSFERRED';
  assignedBy: {
    userId: mongoose.Types.ObjectId;
    role: string;
    name: string;
  };
  approvedBy?: {
    userId: mongoose.Types.ObjectId;
    role: string;
    name: string;
  };
  approvedAt?: Date;
  rejectionReason?: string;
  
  // Operational Details
  specialInstructions?: string;
  allowances?: Array<{
    type: string;
    amount: number;
    reason: string;
  }>;
  
  // Transfer & History
  replacesAssignmentId?: mongoose.Types.ObjectId;
  transferReason?: string;
  
  // Audit Trail
  createdAt: Date;
  updatedAt: Date;
}

const GuardAssignmentSchema = new Schema<IGuardAssignment>(
  {
    // Core Assignment
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Operator',
      required: [true, 'Operator is required'],
      index: true,
    },
    beatId: {
      type: Schema.Types.ObjectId,
      ref: 'Beat',
      required: [true, 'BEAT is required - every guard must be assigned to a BEAT'],
      index: true,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location is required'],
      index: true,
    },
    supervisorId: {
      type: Schema.Types.ObjectId,
      ref: 'Supervisor',
      required: [true, 'Supervisor is required'],
      index: true,
    },
    
    // Assignment Details
    assignmentType: {
      type: String,
      enum: ['PERMANENT', 'TEMPORARY', 'RELIEF'],
      default: 'PERMANENT',
      required: true,
    },
    shiftType: {
      type: String,
      enum: ['DAY', 'NIGHT', '24_HOURS', 'ROTATING'],
      required: [true, 'Shift type is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      validate: {
        validator: function(this: IGuardAssignment, value: Date) {
          if (!value) return true;
          return value > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    
    // Approval Workflow
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'REJECTED', 'ENDED', 'TRANSFERRED'],
      default: 'PENDING',
      required: true,
      index: true,
    },
    assignedBy: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      role: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    approvedBy: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      role: String,
      name: String,
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    
    // Operational Details
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: [500, 'Special instructions cannot exceed 500 characters'],
    },
    allowances: [
      {
        type: {
          type: String,
          required: true,
          enum: ['TRANSPORT', 'HAZARD_PAY', 'NIGHT_DIFFERENTIAL', 'REMOTE_LOCATION', 'OVERTIME', 'OTHER'],
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        reason: {
          type: String,
          required: true,
        },
      },
    ],
    
    // Transfer & History
    replacesAssignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'GuardAssignment',
    },
    transferReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
GuardAssignmentSchema.index({ operatorId: 1, status: 1 });
GuardAssignmentSchema.index({ beatId: 1, status: 1 });
GuardAssignmentSchema.index({ supervisorId: 1, status: 1 });
GuardAssignmentSchema.index({ startDate: 1, endDate: 1 });
GuardAssignmentSchema.index({ 'assignedBy.userId': 1 });

// Compound index for finding active assignments
GuardAssignmentSchema.index({ operatorId: 1, status: 1, startDate: -1 });

// Pre-save validation: Prevent overlapping active assignments
GuardAssignmentSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('status')) {
    if (this.status === 'ACTIVE' || this.status === 'PENDING') {
      const overlappingAssignment = await mongoose.model('GuardAssignment').findOne({
        _id: { $ne: this._id },
        operatorId: this.operatorId,
        status: { $in: ['ACTIVE', 'PENDING'] },
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: this.startDate } },
        ],
      });

      if (overlappingAssignment) {
        throw new Error(
          'Operator already has an active or pending assignment. End or reject the existing assignment first.'
        );
      }
    }
  }
  next();
});

// Virtual for populated operator details
GuardAssignmentSchema.virtual('operator', {
  ref: 'Operator',
  localField: 'operatorId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for populated BEAT details
GuardAssignmentSchema.virtual('bit', {
  ref: 'Beat',
  localField: 'beatId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for populated location details
GuardAssignmentSchema.virtual('location', {
  ref: 'Location',
  localField: 'locationId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for populated supervisor details
GuardAssignmentSchema.virtual('supervisor', {
  ref: 'Supervisor',
  localField: 'supervisorId',
  foreignField: '_id',
  justOne: true,
});

// Static method: Find active assignment for operator
GuardAssignmentSchema.statics.findActiveAssignment = function(operatorId: mongoose.Types.ObjectId) {
  return this.findOne({
    operatorId,
    status: 'ACTIVE',
    $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: new Date() } }],
  })
    .populate('operatorId')
    .populate('beatId')
    .populate('locationId')
    .populate('supervisorId');
};

// Static method: Find assignments for a BEAT
GuardAssignmentSchema.statics.findBitAssignments = function(
  beatId: mongoose.Types.ObjectId,
  status?: string
) {
  const query: any = { beatId };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate({
      path: 'operatorId',
      populate: { path: 'userId', select: 'firstName lastName email phone profilePhoto state' },
    })
    .populate({
      path: 'supervisorId',
      populate: { path: 'userId', select: 'firstName lastName email phone' },
    })
    .populate('locationId')
    .sort({ startDate: -1 });
};

// Static method: Find operator assignment history
GuardAssignmentSchema.statics.findOperatorHistory = function(operatorId: mongoose.Types.ObjectId) {
  return this.find({ operatorId })
    .populate('beatId')
    .populate('locationId')
    .populate('supervisorId')
    .sort({ startDate: -1 });
};

// Enable virtuals in JSON
GuardAssignmentSchema.set('toJSON', { virtuals: true });
GuardAssignmentSchema.set('toObject', { virtuals: true });

export const GuardAssignment = mongoose.model<IGuardAssignment>('GuardAssignment', GuardAssignmentSchema);
