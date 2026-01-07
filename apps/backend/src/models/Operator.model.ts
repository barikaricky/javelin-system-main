import mongoose, { Schema, Document } from 'mongoose';

export interface IGuarantor {
  name: string;
  phone: string;
  address: string;
  photo?: string;
  idType?: string;
  idNumber?: string;
  occupation?: string;
  relationship?: string;
}

export interface IOperator extends Document {
  userId: mongoose.Types.ObjectId;
  supervisorId?: mongoose.Types.ObjectId;
  employeeId: string;
  locationId?: mongoose.Types.ObjectId;
  shiftType?: string;
  passportPhoto?: string;
  bankName?: string;
  bankAccount?: string;
  nationalId?: string;
  documents?: string[];
  guarantors?: IGuarantor[];
  previousExperience?: string;
  medicalFitness?: boolean;
  approvalStatus?: string;
  salary: number;
  startDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OperatorSchema = new Schema<IOperator>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    supervisorId: {
      type: Schema.Types.ObjectId,
      ref: 'Supervisor',
      required: false,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
    },
    shiftType: {
      type: String,
      enum: ['DAY', 'NIGHT', 'ROTATING'],
      default: 'DAY',
    },
    passportPhoto: String,
    bankName: String,
    bankAccount: String,
    nationalId: String,
    documents: [String],
    guarantors: [
      {
        name: {
          type: String,
          required: false,
        },
        phone: {
          type: String,
          required: false,
        },
        address: {
          type: String,
          required: false,
        },
        photo: String,
        idType: String,
        idNumber: String,
        occupation: String,
        relationship: String,
      },
    ],
    previousExperience: String,
    medicalFitness: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    salary: {
      type: Number,
      required: true,
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

OperatorSchema.index({ locationId: 1 });
OperatorSchema.index({ supervisorId: 1 });

// Virtual field for current active assignment
OperatorSchema.virtual('currentAssignment', {
  ref: 'GuardAssignment',
  localField: '_id',
  foreignField: 'operatorId',
  justOne: true,
  match: { status: 'ACTIVE' },
});

// Method to get assignment history
OperatorSchema.methods.getAssignmentHistory = async function() {
  const GuardAssignment = mongoose.model('GuardAssignment');
  return await GuardAssignment.find({ operatorId: this._id })
    .populate('bitId')
    .populate('locationId')
    .sort({ startDate: -1 });
};

// Enable virtuals in JSON
OperatorSchema.set('toJSON', { virtuals: true });
OperatorSchema.set('toObject', { virtuals: true });

export const Operator = mongoose.model<IOperator>('Operator', OperatorSchema);
