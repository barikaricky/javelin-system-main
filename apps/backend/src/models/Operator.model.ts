import mongoose, { Schema, Document } from 'mongoose';

export interface IOperator extends Document {
  userId: mongoose.Types.ObjectId;
  supervisorId: mongoose.Types.ObjectId;
  employeeId: string;
  locationId?: mongoose.Types.ObjectId;
  passportPhoto?: string;
  bankName?: string;
  bankAccount?: string;
  nationalId?: string;
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
      required: true,
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
    passportPhoto: String,
    bankName: String,
    bankAccount: String,
    nationalId: String,
    salary: {
      type: Number,
      required: true,
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
