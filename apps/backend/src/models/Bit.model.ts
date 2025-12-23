import mongoose, { Schema, Document } from 'mongoose';

export interface IBit extends Document {
  bitCode: string;
  bitName: string;
  locationId: mongoose.Types.ObjectId;
  description?: string;
  clientId?: mongoose.Types.ObjectId;
  securityType: string[];
  numberOfOperators: number;
  shiftType: 'DAY' | 'NIGHT' | '24_HOURS' | 'ROTATING';
  startDate?: Date;
  endDate?: Date;
  supervisorId?: mongoose.Types.ObjectId;
  specialInstructions?: string;
  isActive: boolean;
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BitSchema = new Schema<IBit>(
  {
    bitCode: { type: String, required: true, unique: true },
    bitName: { type: String, required: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    description: { type: String },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    securityType: [{ type: String, required: true }],
    numberOfOperators: { type: Number, required: true, default: 1 },
    shiftType: { 
      type: String, 
      enum: ['DAY', 'NIGHT', '24_HOURS', 'ROTATING'], 
      required: true 
    },
    startDate: { type: Date },
    endDate: { type: Date },
    supervisorId: { type: Schema.Types.ObjectId, ref: 'Supervisor' },
    specialInstructions: { type: String },
    isActive: { type: Boolean, default: true },
    createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

BitSchema.index({ locationId: 1 });
BitSchema.index({ isActive: 1 });

export const Bit = mongoose.model<IBit>('Bit', BitSchema);
